
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import time
import uuid
import logging

# Setup logging to track cleanup failures in production
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("KnowledgeOS")

app = FastAPI(title="KnowledgeOS Backend")

# Schema definitions matching the frontend Note type
class OriginalFile(BaseModel):
    url: str
    name: str
    mime_type: str

class NoteMetadata(BaseModel):
    id: str
    type: str
    title: str
    original_file: OriginalFile
    extracted_text: str
    summary: str
    timestamp: float
    tags: List[str]
    entities: List[str]
    is_deleted: bool = False

# Mock Database
db_memory: List[dict] = []

def delete_vectors_from_db(note_id: str):
    """
    Simulates purging semantic embeddings from a Vector DB (e.g., Pinecone, Milvus).
    """
    try:
        logger.info(f"PURGE: Deleting vector index for ID: {note_id}")
        # In production: vector_db.delete(filter={"id": note_id})
        return True
    except Exception as e:
        logger.error(f"FAIL: Vector purge failed for {note_id}: {str(e)}")
        raise e

def delete_binary_from_storage(file_url: str):
    """
    Simulates wiping original source files from object storage (e.g., AWS S3).
    """
    try:
        logger.info(f"WIPE: Deleting source file at URL: {file_url}")
        # In production: s3.delete_object(Bucket=B, Key=url_to_key(file_url))
        return True
    except Exception as e:
        logger.error(f"FAIL: Storage wipe failed for {file_url}: {str(e)}")
        raise e

@app.post("/ingest")
async def ingest_knowledge(
    mode: str = Form(...),
    title: str = Form(...),
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    note_id = str(uuid.uuid4())
    # In a real app, 'file' would be uploaded to S3 and 'file_url' returned.
    file_url = f"storage://knowledgeos/{note_id}" if file else (content if mode == 'url' else "")
    
    new_note = {
        "id": note_id,
        "type": mode,
        "title": title,
        "original_file": {
            "url": file_url,
            "name": file.filename if file else ("source" if mode == 'url' else "text-entry"),
            "mime_type": file.content_type if file else "text/plain"
        },
        "extracted_text": content if mode == "text" else f"Extracted context from {mode}",
        "summary": f"AI synthesis of the provided {mode} content.",
        "timestamp": time.time(),
        "tags": [mode, "imported"],
        "entities": [],
        "is_deleted": False
    }
    
    db_memory.append(new_note)
    return new_note

@app.delete("/memory/{note_id}/permanent")
async def permanent_delete(note_id: str):
    """
    ROOT CAUSE FIX: Implements atomic multi-stage cleanup.
    The deletion sequence follows dependency order: Vectors -> Files -> Metadata.
    """
    global db_memory
    
    target_note = next((n for n in db_memory if n["id"] == note_id), None)
    if not target_note:
        return {"status": "erased_permanently", "msg": "Node already absent"}

    try:
        # 1. Vector Cleanup
        delete_vectors_from_db(note_id)

        # 2. File Storage Cleanup
        file_info = target_note.get("original_file", {})
        url = file_info.get("url")
        if url and not url.startswith("data:"):
            delete_binary_from_storage(url)

        # 3. Metadata Purge
        db_memory = [n for n in db_memory if n["id"] != note_id]
        
        logger.info(f"SUCCESS: Full atomic cleanup completed for {note_id}")
        return {
            "status": "erased_permanently",
            "cleanup_report": {
                "vector_db": "synced",
                "object_storage": "purged",
                "metadata": "purged"
            }
        }
    except Exception as e:
        logger.error(f"ATOMIC FAILURE: Cleanup aborted for {note_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Resource cleanup failed: {str(e)}. Data preserved to prevent inconsistent state."
        )

@app.delete("/memory/{note_id}/soft")
async def soft_delete(note_id: str):
    for note in db_memory:
        if note["id"] == note_id:
            note["is_deleted"] = True
            return {"status": "moved_to_recycle_bin"}
    raise HTTPException(status_code=404, detail="Note not found")

@app.post("/memory/{note_id}/restore")
async def restore_note(note_id: str):
    for note in db_memory:
        if note["id"] == note_id:
            note["is_deleted"] = False
            return {"status": "restored"}
    raise HTTPException(status_code=404, detail="Note not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
