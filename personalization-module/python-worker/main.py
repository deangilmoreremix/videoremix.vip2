from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from maigret_runner import run_maigret_scan

app = FastAPI()

class ScanRequest(BaseModel):
    username: str
    appId: str
    mode: str

class ScanResult(BaseModel):
    scanId: str
    username: str
    appId: str
    mode: str
    profiles: list

WORKER_KEY = None

@app.on_event("startup")
def startup_event():
    global WORKER_KEY
    from os import environ
    WORKER_KEY = environ.get('PERSONALIZER_WORKER_KEY')

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/scan", response_model=ScanResult)
def scan(request: ScanRequest, x_worker_key: Optional[str] = Header(None)):
    if WORKER_KEY and x_worker_key != WORKER_KEY:
        raise HTTPException(status_code=401, detail="Invalid worker key")

    try:
        profiles = run_maigret_scan(request.username)
        return {
            "scanId": f"scan_{request.username}_{request.appId}_{request.mode}",
            "username": request.username,
            "appId": request.appId,
            "mode": request.mode,
            "profiles": profiles,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
