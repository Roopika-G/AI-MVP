from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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