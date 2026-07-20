"""
Maigret Worker Service (deployed flat layout — entry: `main:app`)

FastAPI service that wraps the Maigret username OSINT library and exposes a
single `/scan` endpoint that the Netlify `personalizer-api` function calls
with the `X-API-Key` header.

This is the production deployment of the graph-enabled worker. It emits
`graph.nodes/edges` (seed/platform/alias/identity; claimed/alias_of/
permutation_of/same_identity) so PersonalizeModal's Connection Graph renders
real scan data instead of the client-side simulator.

Endpoints:
  POST /scan          — run a Maigret scan for a username (returns graph)
  GET  /health        — health check (no auth)
  GET  /cache/{key}   — inspect a cached result
  DELETE /cache/{key} — invalidate a cached result (admin only)
  GET  /stats         — service stats (admin only)

Environment variables:
  MAIGRET_API_KEY / MAIGRET_WORKER_SECRET — required. Key clients send in X-API-Key
  MAIGRET_ADMIN_KEY        — optional admin key for /cache DELETE and /stats
  MAIGRET_CACHE_BACKEND    — "memory" (default)
  MAIGRET_CACHE_TTL_SECONDS — cache TTL (default 86400)
  MAIGRET_MAX_CONCURRENT   — max concurrent scans (default 4)
  MAIGRET_PER_KEY_LIMIT    — scans per key per hour (default 100)
  MAIGRET_SCAN_TIMEOUT     — per-scan timeout seconds (default 90)
  ALLOWED_ORIGINS          — comma-separated CORS origins (default *)
  PORT                     — port to bind (default 8000)
"""

import asyncio
import hashlib
import hmac
import logging
import os
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from scanner import MaigretScanner, ScanOptions, ScanResult

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

API_KEY = (
    os.environ.get("MAIGRET_API_KEY", "").strip()
    or os.environ.get("MAIGRET_WORKER_SECRET", "").strip()
)
ADMIN_KEY = os.environ.get("MAIGRET_ADMIN_KEY", "").strip() or API_KEY
CACHE_BACKEND = os.environ.get("MAIGRET_CACHE_BACKEND", "memory").lower()
CACHE_TTL = int(os.environ.get("MAIGRET_CACHE_TTL_SECONDS", "86400"))
MAX_CONCURRENT = int(os.environ.get("MAIGRET_MAX_CONCURRENT", "4"))
PER_KEY_LIMIT = int(os.environ.get("MAIGRET_PER_KEY_LIMIT", "100"))
SCAN_TIMEOUT = int(os.environ.get("MAIGRET_SCAN_TIMEOUT", "90"))
ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "*").split(",") if o.strip()
]
PORT = int(os.environ.get("PORT", "8000"))

if not API_KEY:
    logging.warning("MAIGRET_API_KEY/MAIGRET_WORKER_SECRET not set; /scan will be rejected")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("maigret-worker")

# ---------------------------------------------------------------------------
# Minimal in-memory cache (TTL-based)
# ---------------------------------------------------------------------------

class _MemCache:
    def __init__(self, ttl: int):
        self._store: Dict[str, Any] = {}
        self._expires: Dict[str, float] = {}
        self._ttl = ttl

    async def start(self):
        pass

    async def stop(self):
        self._store.clear()

    async def get(self, key: str):
        if key in self._store and time.time() < self._expires.get(key, 0):
            return self._store[key]
        self._store.pop(key, None)
        return None

    async def set(self, key: str, value: Any):
        self._store[key] = value
        self._expires[key] = time.time() + self._ttl

    async def delete_prefix(self, prefix: str) -> int:
        n = 0
        for k in list(self._store.keys()):
            if k.startswith(prefix):
                self._store.pop(k, None)
                self._expires.pop(k, None)
                n += 1
        return n


# ---------------------------------------------------------------------------
# Rate limiting (per API key, sliding 1h window)
# ---------------------------------------------------------------------------

_scan_history: Dict[str, List[float]] = defaultdict(list)
_scan_semaphore = asyncio.Semaphore(MAX_CONCURRENT)
cache: Optional[_MemCache] = None


def _check_per_key_rate_limit(key_hash: str) -> None:
    now = time.time()
    window_start = now - 3600
    history = [t for t in _scan_history[key_hash] if t > window_start]
    _scan_history[key_hash] = history
    if len(history) >= PER_KEY_LIMIT:
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded: {PER_KEY_LIMIT} scans/hour per API key")
    _scan_history[key_hash].append(now)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global cache
    cache = _MemCache(CACHE_TTL) if CACHE_BACKEND == "memory" else None
    if cache:
        await cache.start()
    logger.info("Cache backend: %s (ttl=%ss)", CACHE_BACKEND, CACHE_TTL)
    logger.info("Listening on port %s", PORT)
    yield
    if cache:
        await cache.stop()


app = FastAPI(title="Maigret Worker", description="Username OSINT service for the personalizer platform", version="1.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=True, allow_methods=["GET", "POST", "DELETE", "OPTIONS"], allow_headers=["*"])


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def _hash_key(key: str) -> str:
    return hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]


def _scan_cache_key(username: str, top: int, is_parsing_enabled: bool) -> str:
    return f"scan:{username.lower()}:{top}:{is_parsing_enabled}"


async def require_api_key(x_api_key: Optional[str] = Header(default=None)) -> str:
    if not API_KEY:
        raise HTTPException(status_code=503, detail="MAIGRET_API_KEY not configured on server")
    if not x_api_key or not hmac.compare_digest(x_api_key, API_KEY):
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key")
    return x_api_key


async def require_admin_key(x_api_key: Optional[str] = Header(default=None)) -> str:
    if not ADMIN_KEY:
        raise HTTPException(status_code=503, detail="MAIGRET_ADMIN_KEY not configured on server")
    if not x_api_key or not hmac.compare_digest(x_api_key, ADMIN_KEY):
        raise HTTPException(status_code=401, detail="Invalid or missing admin X-API-Key")
    return x_api_key


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ScanRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=100, description="Username to scan")
    top: int = Field(default=500, ge=1, le=2500, description="Max sites to check")
    isParsingEnabled: bool = Field(default=True, description="Parse profile pages for extra data")
    timeoutMs: int = Field(default=15000, ge=1000, le=60000, description="Per-site HTTP timeout")
    enableCloudflareBypass: bool = Field(default=False, description="Include disabled sites / attempt Cloudflare bypass")
    parseUrl: Optional[str] = Field(default=None, description="Specific URL to also parse")
    useCache: bool = Field(default=True, description="Return cached result if available")
    tags: Optional[List[str]] = Field(default=None, description="Restrict scan to these site tags")
    proxy: Optional[str] = Field(default=None, description="Proxy URL (e.g. socks5://127.0.0.1:1080)")
    retries: int = Field(default=1, ge=0, le=5, description="Retries for temporarily failed requests")
    noRecursion: bool = Field(default=True, description="Disable recursive search by extracted data")
    permute: bool = Field(default=False, description="Permute >=2 usernames to generate more candidates")
    checkDomains: bool = Field(default=False, description="Also check domains on the username")

    @field_validator("username")
    @classmethod
    def _validate_username(cls, v: str) -> str:
        v = v.strip().lstrip("@")
        if not v:
            raise ValueError("username cannot be empty")
        if not all(c.isalnum() or c in "-_." for c in v):
            raise ValueError("username must be alphanumeric with -_. allowed")
        return v


class ScanResponse(BaseModel):
    username: str
    platforms: List[Dict[str, Any]]
    summary: str
    confidence: float
    cached: bool
    durationMs: int
    sitesChecked: int
    sitesFound: int
    graph: Dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "maigret-worker",
        "version": "1.1.0",
        "cache_backend": CACHE_BACKEND,
        "max_concurrent": MAX_CONCURRENT,
        "scan_timeout_s": SCAN_TIMEOUT,
        "api_key_configured": bool(API_KEY),
    }


@app.post("/scan", response_model=ScanResponse)
async def scan(body: ScanRequest, api_key: str = Depends(require_api_key)):
    key_hash = _hash_key(api_key)
    _check_per_key_rate_limit(key_hash)

    cache_key = _scan_cache_key(body.username, body.top, body.isParsingEnabled)
    logger.info("scan requested username=%s key=%s", body.username, key_hash)

    if body.useCache and cache is not None:
        cached = await cache.get(cache_key)
        if cached is not None:
            logger.info("cache hit username=%s", body.username)
            cached["cached"] = True
            return cached

    options = ScanOptions(
        top=body.top,
        is_parsing_enabled=body.isParsingEnabled,
        timeout_ms=body.timeoutMs,
        enable_cloudflare_bypass=body.enableCloudflareBypass,
        parse_url=body.parseUrl,
        tags=body.tags,
        proxy=body.proxy,
        retries=body.retries,
        no_recursion=body.noRecursion,
        permute=body.permute,
        check_domains=body.checkDomains,
    )

    async with _scan_semaphore:
        scanner = MaigretScanner(options)
        try:
            result = await asyncio.wait_for(scanner.scan(body.username), timeout=SCAN_TIMEOUT)
        except asyncio.TimeoutError:
            logger.error("scan timed out after %ss username=%s", SCAN_TIMEOUT, body.username)
            raise HTTPException(status_code=504, detail=f"Scan timed out after {SCAN_TIMEOUT}s")
        except Exception as exc:  # noqa: BLE001
            logger.exception("scan failed username=%s", body.username)
            raise HTTPException(status_code=500, detail=f"Scan failed: {exc}")

    response = {
        "username": result.username,
        "platforms": result.platforms,
        "summary": result.summary,
        "confidence": result.confidence,
        "cached": False,
        "durationMs": result.duration_ms,
        "sitesChecked": result.sites_checked,
        "sitesFound": result.sites_found,
        "graph": result.graph,
    }

    if cache is not None:
        await cache.set(cache_key, response)

    return response


@app.get("/cache/{username}")
async def inspect_cache(username: str, api_key: str = Depends(require_api_key)):
    if cache is None:
        return {"cached": False}
    cached = await cache.get(_scan_cache_key(username, 500, True))
    if cached is None:
        return {"cached": False, "username": username}
    return {"cached": True, "username": username, "result": cached}


@app.delete("/cache/{username}")
async def invalidate_cache(username: str, _admin: str = Depends(require_admin_key)):
    if cache is None:
        return {"deleted": 0}
    deleted = await cache.delete_prefix(f"scan:{username.lower()}:")
    return {"deleted": deleted, "username": username}


@app.get("/stats")
async def stats(_admin: str = Depends(require_admin_key)):
    now = time.time()
    window_start = now - 3600
    per_key = {k: len([t for t in ts if t > window_start]) for k, ts in _scan_history.items()}
    return {
        "scans_last_hour": sum(per_key.values()),
        "active_keys_last_hour": len(per_key),
        "per_key": per_key,
        "max_concurrent": MAX_CONCURRENT,
        "scan_timeout_s": SCAN_TIMEOUT,
        "cache_backend": CACHE_BACKEND,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, log_level="info")
