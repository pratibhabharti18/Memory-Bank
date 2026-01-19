
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import time
import uuid

app = FastAPI(title="KnowledgeOS Backend")

# Memory Schema mirroring the React frontend
class NoteMetadata(BaseModel):
    id: str
    type: str
    title: str
    original_file_url: str
    original_file_name: str
    extracted_text: str
    summary: str
    timestamp: float
    tags: List[str]
    is_deleted: bool = False

# Mock Database
db_memory = []

@app.post("/ingest")
async def ingest_knowledge(
    mode: str = Form(...),
    title: str = Form(...),
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """
    1. Receives file/text/url
    2. Stores binary file to S3 (Mocked here)
    3. Triggers Gemini for extraction
    4. Generates Vector Embeddings ONLY from extracted_text
    """
    note_id = str(uuid.uuid4())
    
    # Logic: If file, upload and get URL
    file_url = f"https://storage.knowledgeos.ai/{note_id}" if file else content
    
    # Logic: Call Gemini (Simplified)
    extracted_text = content if mode == "text" else f"Extracted text from {mode}"
    summary = f"AI summary of {mode}"
    
    new_note = {
        "id": note_id,
        "type": mode,
        "title": title,
        "original_file": {
            "url": file_url,
            "name": file.filename if file else "source",
            "mime_type": file.content_type if file else "text/plain"
        },
        "extracted_text": extracted_text, # <--- Used for Vector DB
        "summary": summary,
        "timestamp": time.time(),
        "is_deleted": False
    }
    
    db_memory.append(new_note)
    
    # Logic: index_in_vector_db(extracted_text, note_id)
    
    return new_note

@app.delete("/memory/{note_id}/soft")
async def soft_delete(note_id: str):
    """Marks note as deleted without removing from DB/Vector Store."""
    for note in db_memory:
        if note["id"] == note_id:
            note["is_deleted"] = True
            return {"status": "moved_to_recycle_bin"}
    raise HTTPException(status_code=404, detail="Note not found")

@app.post("/memory/{note_id}/restore")
async def restore_note(note_id: str):
    """Restores a soft-deleted note."""
    for note in db_memory:
        if note["id"] == note_id:
            note["is_deleted"] = False
            return {"status": "restored"}
    raise HTTPException(status_code=404, detail="Note not found")

@app.delete("/memory/{note_id}/permanent")
async def permanent_delete(note_id: str):
    """Deletes from both primary storage and vector database."""
    global db_memory
    db_memory = [n for n in db_memory if n["id"] != note_id]
    # Logic: delete_from_vector_db(note_id)
    return {"status": "erased_permanently"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
