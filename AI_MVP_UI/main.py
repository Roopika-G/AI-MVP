from fastapi import FastAPI, HTTPException, Request, File, Response, UploadFile
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
    
@app.post("/process-audio")
async def process_audio(audio_file: UploadFile = File(...)):
    # Save uploaded file to a temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_in:
        tmp_in.write(await audio_file.read())
        tmp_in_path = tmp_in.name

    tmp_out_path = tmp_in_path.replace(".wav", "_processed.wav")

    # Call your separate Python script to process the audio
    # For demo, just copy the file (replace this with your processing logic)
    subprocess.run(["python", "audio_processor.py", tmp_in_path, tmp_out_path])

    # Read processed audio and return
    with open(tmp_out_path, "rb") as f:
        audio_bytes = f.read()

    # Clean up temp files
    os.remove(tmp_in_path)
    os.remove(tmp_out_path)

    return Response(content=audio_bytes, media_type="audio/wav")