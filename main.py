from fastapi import FastAPI, HTTPException, Request, File, Response, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import subprocess
from pydantic import BaseModel
import yaml

# Load config
def load_config():
    with open("config.yaml", "r") as f:
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

@app.post("/login")
def login(data: LoginRequest):
    config = load_config()
    ldap_conf = config["ldap"]
    # For now, check username and password against config.yaml
    if (
        data.username == ldap_conf.get("username", "admin") and
        data.password == ldap_conf.get("password", "admin")
    ):
        return {"success": True, "message": "Login successful"}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials") 
    

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