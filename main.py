import warnings
# Comprehensive warning suppression - must be done before any other imports
warnings.filterwarnings("ignore", category=DeprecationWarning) 
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", message=".*HuggingFaceEmbeddings.*deprecated.*")
warnings.filterwarnings("ignore", message=".*Chroma.*deprecated.*")
warnings.filterwarnings("ignore", message=".*langchain.*")

# imports for installing requirements and starting the FastAPI backend server
import sys
import os
import subprocess

# Function to install required packages automatically
def install_requirements():
    """Install all required packages from requirements.txt before starting the server"""
    try:
        requirements_path = os.path.join(os.path.dirname(__file__), "requirements.txt")
        if not os.path.exists(requirements_path):
            print("requirements.txt not found - skipping package installation")
            return
        
        # Check if key packages are already installed to avoid reinstalling on every reload
        try:
            import fastapi
            import uvicorn
            import langchain
            import chromadb
            # import knowledge
            print("Key packages already installed - skipping installation")
            return
        except ImportError:
            # If any key package is missing, proceed with installation
            pass
        
        print("Installing packages from requirements.txt...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", requirements_path])
        print("All requirements installed successfully!")
        
    except subprocess.CalledProcessError as e:
        print(f"Error installing requirements: {e}")
        print("Continuing with startup - some features may not work properly")
    except Exception as e:
        print(f"Unexpected error during package installation: {e}")
        print("Continuing with startup - some features may not work properly")

# Install requirements before importing other modules
# print("Checking and installing required packages...")
# install_requirements()

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__),".", "agenbotc")))
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

from ingestion import process_pdf, process_docx, process_ppt, process_website
from chatbot import get_chatbot_response

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
    # Ensure uploads go to agenbotc folder
    agenbotc_dir = os.path.join(os.path.dirname(__file__), "agenbotc")
    uploads_dir = os.path.join(agenbotc_dir, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    
    file_location = os.path.join(uploads_dir, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())
    try:
        result = process_pdf(file_location)
        if isinstance(result, dict):
            if result.get("is_duplicate"):
                return {"status": "duplicate", "message": result["message"], "doc_id": result["doc_id"]}
            else:
                return {"status": "success", "message": result["message"], "doc_id": result["doc_id"]}
        else:
            # Backward compatibility for old return format
            return {"status": "success", "message": f"PDF processed successfully", "doc_id": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
# -------------------------------------------------------------------------------------------------------------
# api to handle docx file upload for RAG training and vector storing
@app.post("/upload/docx")
async def upload_docx(file: UploadFile = File(...)):
    # Ensure uploads go to agenbotc folder
    agenbotc_dir = os.path.join(os.path.dirname(__file__), "agenbotc")
    uploads_dir = os.path.join(agenbotc_dir, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    
    file_location = os.path.join(uploads_dir, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())
    try:
        result = process_docx(file_location)
        if isinstance(result, dict):
            if result.get("is_duplicate"):
                return {"status": "duplicate", "message": result["message"], "doc_id": result["doc_id"]}
            else:
                return {"status": "success", "message": result["message"], "doc_id": result["doc_id"]}
        else:
            # Backward compatibility for old return format
            return {"status": "success", "message": f"DOCX processed successfully", "doc_id": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
# -------------------------------------------------------------------------------------------------------------
# api to handle ppt file upload for RAG training and vector storing
@app.post("/upload/ppt")
async def upload_ppt(file: UploadFile = File(...)):
    # Ensure uploads go to agenbotc folder
    agenbotc_dir = os.path.join(os.path.dirname(__file__), "agenbotc")
    uploads_dir = os.path.join(agenbotc_dir, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    
    file_location = os.path.join(uploads_dir, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())
    try:
        result = process_ppt(file_location)
        if isinstance(result, dict):
            if result.get("is_duplicate"):
                return {"status": "duplicate", "message": result["message"], "doc_id": result["doc_id"]}
            else:
                return {"status": "success", "message": result["message"], "doc_id": result["doc_id"]}
        else:
            # Backward compatibility for old return format
            return {"status": "success", "message": f"PPT processed successfully", "doc_id": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# -------------------------------------------------------------------------------------------------------------
# api to handle website content processing by URL for RAG training and vector storing
@app.post("/process/website")
async def process_web(url: str = Form(...)):
    try:
        result = process_website(url)
        if isinstance(result, dict):
            if result.get("is_duplicate"):
                return {"status": "duplicate", "message": result["message"], "doc_id": result["doc_id"]}
            else:
                return {"status": "success", "message": result["message"], "doc_id": result["doc_id"]}
        else:
            # Backward compatibility for old return format
            return {"status": "success", "message": f"Website processed successfully", "doc_id": result}
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