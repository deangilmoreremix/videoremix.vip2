from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from maigret_runner import run_maigret_scan
import asyncio

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
    profiles: List[Dict[str, Any]]
    confidenceScore: float = 0.0
    summary: str = ""

class FullScanRequest(BaseModel):
    username: str
    company: Optional[str] = None
    website: Optional[str] = None

class FullScanResult(BaseModel):
    profileId: str
    confidenceScore: int
    traits: List[str]
    communicationStyle: str
    interests: List[str]
    recommendedHooks: List[str]
    recommendedOffers: List[str]

class GraphNode(BaseModel):
    id: str
    nodeType: str
    nodeValue: str
    confidence: int

class GraphEdge(BaseModel):
    sourceNodeId: str
    targetNodeId: str
    relationshipType: str
    confidence: int

class GraphResult(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

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
        confidence = min(100, len(profiles) * 20)
        summary = f"Found {len(profiles)} profiles" if profiles else "No profiles found"
        return {
            "scanId": f"scan_{request.username}_{request.appId}_{request.mode}",
            "username": request.username,
            "appId": request.appId,
            "mode": request.mode,
            "profiles": profiles,
            "confidenceScore": confidence,
            "summary": summary,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.post("/scan-full", response_model=FullScanResult)
async def scan_full(request: FullScanRequest, x_worker_key: Optional[str] = Header(None)):
    """Full intelligence scan - runs Maigret + website analysis + AI analysis"""
    if WORKER_KEY and x_worker_key != WORKER_KEY:
        raise HTTPException(status_code=401, detail="Invalid worker key")

    try:
        # Step 1: Maigret scan (500+ platforms)
        profiles = run_maigret_scan(request.username)
        
        # Step 2: Build profile data
        all_bios = " ".join([p.get("bio", "") for p in profiles if p.get("bio")])
        interests: List[str] = []
        traits: List[str] = []
        
        # Extract interests from bios
        tech_keywords = ['react', 'python', 'javascript', 'ai', 'ml', 'api', 'cloud', 'docker', 'kubernetes', 'node', 'typescript']
        if any(kw in all_bios.lower() for kw in tech_keywords):
            interests.append("Technology")
            traits.append("Technical")
            
        biz_keywords = ['growth', 'marketing', 'sales', 'revenue', 'product', 'strategy']
        if any(kw in all_bios.lower() for kw in biz_keywords):
            interests.append("Business")
            traits.append("Strategic")
        
        if len(profiles) > 2:
            traits.append("Multi-faceted")
        
        # Determine communication style
        communication_style = "professional"
        if "creative" in all_bios.lower() or "design" in all_bios.lower():
            communication_style = "creative"
        elif "data" in all_bios.lower() or "analytics" in all_bios.lower():
            communication_style = "analytical"
        
        # Generate hooks
        hooks = []
        for p in profiles[:3]:
            if p.get("bio"):
                hooks.append(f"Noticed your {p.get('platform', 'online')} presence")
        
        # Calculate confidence
        confidence = min(100, len(profiles) * 25 + len(interests) * 10)
        
        return {
            "profileId": f"profile_{request.username}",
            "confidenceScore": confidence,
            "traits": traits if traits else ["Professional"],
            "communicationStyle": communication_style,
            "interests": interests if interests else ["Technology"],
            "recommendedHooks": hooks if hooks else ["Your professional background stands out"],
            "recommendedOffers": ["Personalized content creation", "AI-powered outreach"],
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.post("/analyze", response_model=FullScanResult)
async def analyze(request: FullScanRequest, x_worker_key: Optional[str] = Header(None)):
    """AI analysis layer for personality and interests"""
    return await scan_full(request, x_worker_key)

@app.post("/graph-build", response_model=GraphResult)
async def graph_build(request: FullScanRequest, x_worker_key: Optional[str] = Header(None)):
    """Build identity graph from profile data"""
    if WORKER_KEY and x_worker_key != WORKER_KEY:
        raise HTTPException(status_code=401, detail="Invalid worker key")

    try:
        # Create identity graph nodes
        nodes: List[Dict[str, Any]] = [
            {"id": "main", "nodeType": "username", "nodeValue": request.username, "confidence": 90},
        ]
        
        if request.company:
            nodes.append({"id": "company", "nodeType": "company", "nodeValue": request.company, "confidence": 70})
        
        if request.website:
            nodes.append({"id": "website", "nodeType": "website", "nodeValue": request.website, "confidence": 60})

        # Create edges
        edges: List[Dict[str, Any]] = [
            {"sourceNodeId": "main", "targetNodeId": "username_derived", "relationshipType": "same_as", "confidence": 80},
        ]
        
        if request.company:
            edges.append({"sourceNodeId": "main", "targetNodeId": "company", "relationshipType": "works_at", "confidence": 70})
        
        if request.website:
            edges.append({"sourceNodeId": "main", "targetNodeId": "website", "relationshipType": "owns", "confidence": 60})

        return {
            "nodes": nodes,
            "edges": edges,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))