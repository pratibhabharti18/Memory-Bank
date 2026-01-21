
import os
import time
import uuid
import logging
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt

# Security Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-knowledge-os-key-2025")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("KnowledgeOS")

app = FastAPI(title="KnowledgeOS Backend")

# --- DATABASE MODELS ---

class UserDB(BaseModel):
    id: str
    email: str
    name: str
    password_hash: Optional[str] = None
    auth_provider: str # 'local' or 'google'
    profile_pic: Optional[str] = None
    is_verified: bool = False
    created_at: float

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class GoogleAuthRequest(BaseModel):
    token: str # ID Token from Google
    email: str
    name: str
    picture: str

# --- MOCK PERSISTENCE ---
users_db: List[dict] = []
db_memory: List[dict] = []

# --- AUTH UTILITIES ---

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = next((u for u in users_db if u["id"] == user_id), None)
    if user is None:
        raise credentials_exception
    return user

# --- AUTH ENDPOINTS ---

@app.post("/auth/signup", response_model=Token)
async def signup(req: SignupRequest):
    if any(u["email"] == req.email for u in users_db):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = {
        "id": str(uuid.uuid4()),
        "email": req.email,
        "name": req.name,
        "password_hash": hash_password(req.password),
        "auth_provider": "local",
        "is_verified": False,
        "created_at": time.time()
    }
    users_db.append(new_user)
    
    access_token = create_access_token(data={"sub": new_user["id"]})
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}

@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = next((u for u in users_db if u["email"] == form_data.username), None)
    if not user or not user.get("password_hash") or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user["id"]})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.post("/auth/google", response_model=Token)
async def google_auth(req: GoogleAuthRequest):
    # In production, verify the 'req.token' with google-auth library
    user = next((u for u in users_db if u["email"] == req.email), None)
    
    if not user:
        user = {
            "id": str(uuid.uuid4()),
            "email": req.email,
            "name": req.name,
            "auth_provider": "google",
            "profile_pic": req.picture,
            "is_verified": True,
            "created_at": time.time()
        }
        users_db.append(user)
    else:
        # Link account or update profile pic
        user["auth_provider"] = "google"
        user["profile_pic"] = req.picture
        user["is_verified"] = True

    access_token = create_access_token(data={"sub": user["id"]})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

# --- KNOWLEDGE ENDPOINTS (PROTECTED & ISOLATED) ---

@app.get("/memory")
async def get_memories(current_user: dict = Depends(get_current_user)):
    """Data Isolation: Filter by current_user ID."""
    return [n for n in db_memory if n["userId"] == current_user["id"]]

@app.post("/ingest")
async def ingest_knowledge(
    mode: str = Form(...),
    title: str = Form(...),
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    note_id = str(uuid.uuid4())
    file_url = f"storage://{current_user['id']}/{note_id}" if file else (content if mode == 'url' else "")
    
    new_note = {
        "id": note_id,
        "userId": current_user["id"], # Mandatory link
        "type": mode,
        "title": title,
        "original_file": {
            "url": file_url,
            "name": file.filename if file else ("source" if mode == 'url' else "text-entry"),
            "mime_type": file.content_type if file else "text/plain"
        },
        "extracted_text": content if mode == "text" else f"Extracted context for {current_user['name']}",
        "summary": f"Personal AI summary for {current_user['name']}.",
        "timestamp": time.time(),
        "tags": [mode],
        "entities": [],
        "is_deleted": False
    }
    
    db_memory.append(new_note)
    return new_note

@app.delete("/memory/{note_id}/permanent")
async def permanent_delete(note_id: str, current_user: dict = Depends(get_current_user)):
    """Atomic cleanup with strict ownership check."""
    global db_memory
    
    target_note = next((n for n in db_memory if n["id"] == note_id and n["userId"] == current_user["id"]), None)
    if not target_note:
        raise HTTPException(status_code=403, detail="Not authorized to delete this resource")

    # Mock cleanup of vector DB and storage...
    db_memory = [n for n in db_memory if not (n["id"] == note_id and n["userId"] == current_user["id"])]
    return {"status": "erased_permanently"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
