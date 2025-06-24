import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "agenbotc")))
from fastapi import FastAPI, HTTPException, Request, File, Response, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import subprocess
from pydantic import BaseModel
import yaml
from pydantic import BaseModel
from typing import List, Optional
from fastapi import Form
from fastapi import UploadFile, File

from ingestion import process_pdf, process_docx, process_ppt, process_website #WILL NEED THESE FROM MURALI'S CODE Ingest.py
from chatbot import get_chatbot_response # WILL NEED THESE FROM MURALI'S CODE Chatbot.py

# Load config
def load_config():
    config_path = os.path.join(os.path.dirname(__file__), "config.yaml")
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    username: str
    password: str

# new login with two users - test and admin. Passwords are in config.yaml
@app.post("/login")
def login(data: LoginRequest):
       config = load_config()
       users = config.get("users", [])
       print("Loaded users:", users)
       print("Login attempt:", data.username, data.password)
       for user in users:
           if data.username == user["username"] and data.password == user["password"]:
               return {"success": True, "message": "Login successful", "role": user.get("role", "user")}
       raise HTTPException(status_code=401, detail="Invalid credentials")

# -------------------------------------------------------------------------------------------------------------
# api to test recording and transcription and saves it in recordings folder
RECORDINGS_DIR = os.path.join(os.path.dirname(__file__), "recording_tests")
os.makedirs(RECORDINGS_DIR, exist_ok=True)
@app.post("/save-recording")
async def save_recording(
    audio_file: UploadFile = File(...),
    transcript: str = Form(...)
):
    # Find next available record number
    existing = [f for f in os.listdir(RECORDINGS_DIR) if f.startswith("record") and f.endswith(".wav")]
    numbers = [int(f[6:-4]) for f in existing if f[6:-4].isdigit()]
    next_num = max(numbers, default=0) + 1

    audio_path = os.path.join(RECORDINGS_DIR, f"record{next_num}.wav")
    transcript_path = os.path.join(RECORDINGS_DIR, f"record{next_num}_transcript.txt")

    # Save audio
    with open(audio_path, "wb") as f:
        f.write(await audio_file.read())

    # Save transcript
    with open(transcript_path, "w", encoding="utf-8") as f:
        f.write(transcript)

    return {"success": True, "recording_number": next_num}

# -------------------------------------------------------------------------------------------------------------
# api for text to speech testing
@app.get("/get-avatar-text")
async def get_avatar_text():
    # You can replace this with any logic or dynamic text
    return {"text": "Hello! This is the AI avatar speaking from the backend."}

# -------------------------------------------------------------------------------------------------------------
# api to handle file upload (pdf type) for RAG training and vector storing
@app.post("/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    file_location = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(file_location, "wb") as f:
        f.write(await file.read())
    try:
        doc_id = process_pdf(file_location)
        return {"status": "success", "message": f"PDF processed successfully", "doc_id": doc_id}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
# -------------------------------------------------------------------------------------------------------------
# api to handle docx file upload for RAG training and vector storing
@app.post("/upload/docx")
async def upload_docx(file: UploadFile = File(...)):
    file_location = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(file_location, "wb") as f:
        f.write(await file.read())
    try:
        doc_id = process_docx(file_location)
        return {"status": "success", "message": f"DOCX processed successfully", "doc_id": doc_id}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
# -------------------------------------------------------------------------------------------------------------
# api to handle ppt file upload for RAG training and vector storing
@app.post("/upload/ppt")
async def upload_ppt(file: UploadFile = File(...)):
    file_location = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(file_location, "wb") as f:
        f.write(await file.read())
    try:
        doc_id = process_ppt(file_location)
        return {"status": "success", "message": f"PPT processed successfully", "doc_id": doc_id}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# -------------------------------------------------------------------------------------------------------------
# api to handle website content processing by URL for RAG training and vector storing
@app.post("/process/website")
async def process_web(url: str = Form(...)):
    try:
        doc_id = process_website(url)
        return {"status": "success", "message": f"Website processed successfully", "doc_id": doc_id}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# -------------------------------------------------------------------------------------------------------------
class ChatRequest(BaseModel):
    question: str
    history: List[str] = []

@app.post("/chat")
async def chat(request: ChatRequest):
    response = get_chatbot_response(request.question, request.history)
    return {"response": response}