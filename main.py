import warnings
import sys
import os
import subprocess
from datetime import datetime
from dotenv import load_dotenv

agenbotc_dir = (os.path.join(os.path.dirname(__file__),".", "agenbotc"))
sys.path.append(os.path.abspath(agenbotc_dir))
env_path = os.path.join(agenbotc_dir, ".env")

from fastapi import FastAPI, HTTPException, Request, File, Response, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yaml
from typing import List, Optional

# === Load credentials from .env file (place it with content - OPENAI_API_KEY=<your-api-key> within the agenbotc folder)===
print(f"Loading .env file from: {env_path}")
print(f"File exists: {os.path.exists(env_path)}")
load_dotenv(dotenv_path=env_path)
OPENAI_TOKEN = os.getenv('OPENAI_API_KEY')

# Set the environment variable explicitly for child processes
if OPENAI_TOKEN:
    os.environ['OPENAI_API_KEY'] = OPENAI_TOKEN
else:
    print("WARNING: OPENAI_API_KEY not found in .env file!")

from ingestion import process_pdf, process_docx, process_ppt, process_website
from chatbot import get_chatbot_response
from llm_agent import LLMAgent
from tomcat_monitor import TomcatMonitor

llm_agent = LLMAgent()
tomcat_monitor = TomcatMonitor()   

# Comprehensive warning suppression - must be done before any other imports
warnings.filterwarnings("ignore", category=DeprecationWarning) 
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", message=".*HuggingFaceEmbeddings.*deprecated.*")
warnings.filterwarnings("ignore", message=".*Chroma.*deprecated.*")
warnings.filterwarnings("ignore", message=".*langchain.*")

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
# api for text to speech testing and AI avatar text
@app.get("/get-avatar-text")
async def get_avatar_text():
    # Dynamic text that can be customized based on business logic
    texts = [
        "Welcome to Vega AI! I'm your intelligent assistant ready to help you navigate through our advanced technology solutions.",
        "Hello! I'm here to assist you with PingFederate configurations, identity management, and federated authentication setup.",
        "Greetings! I can help you understand OAUTH flows, SAML configurations, and modern authentication protocols.",
        "Hi there! Let me guide you through our comprehensive identity and access management solutions."
    ]
    
    import random
    selected_text = random.choice(texts)
    
    return {
        "text": selected_text,
        "timestamp": str(datetime.now()),
        "avatar_mode": "repeat",
        "language": "en"
    }

# -------------------------------------------------------------------------------------------------------------
# api for HeyGen access token generation
@app.post("/api/get-heygen-token")
async def get_heygen_token():
    """Generate HeyGen access token for avatar sessions"""
    try:
        # Get HeyGen API key from environment
        heygen_api_key = os.getenv('HEYGEN_API_KEY')
        
        if not heygen_api_key:
            raise HTTPException(status_code=500, detail="HeyGen API key not configured")
        
        # HeyGen API endpoint for generating access tokens
        heygen_url = "https://api.heygen.com/v1/streaming.create_token"
        
        headers = {
            "X-Api-Key": heygen_api_key,
            "Content-Type": "application/json"
        }
        
        # Make request to HeyGen API
        import requests
        response = requests.post(heygen_url, headers=headers)
        
        if response.status_code == 200:
            token_data = response.json()
            return {"token": token_data.get("data", {}).get("token", "")}
        else:
            print(f"HeyGen API error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail="Failed to generate HeyGen token")
            
    except Exception as e:
        print(f"Error generating HeyGen token: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Token generation failed: {str(e)}")

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
class ChatMessage(BaseModel):
    question: str = ""
    answer: str = ""

class ChatRequest(BaseModel):
    question: str
    history: List[ChatMessage] = []

@app.post("/chat")
async def chat(request: ChatRequest):
    # Convert history to the format expected by chatbot
    history_list = []
    for msg in request.history:
        if msg.question and msg.answer:
            history_list.append({"question": msg.question, "answer": msg.answer})
    
    response = get_chatbot_response(request.question, history_list)
    return {"response": response}

# -------------------------------------------------------------------------------------------------------------
# Handles advanced chat interactions using the LLM agent for more sophisticated query processing
@app.post("/Agentchat")
async def Agentchat(request: ChatRequest):
    """Main chat endpoint that routes queries through LLM agent"""
    print("Processing query through LLM agent" + str(request))
    #try:
    response = await llm_agent.process_query(request.question)
    print(f"LLM Agent response: {response}")
    if not isinstance(response, (str, dict)):
        response = str(response)
    return {"response": response}
    # except Exception as e:
    #    return {"response": f"Error processing query: {str(e)}", "status": "error"}