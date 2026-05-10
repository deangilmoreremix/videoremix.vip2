import asyncio
import logging
from maigret import search as maigret_search
from maigret.sites import MaigretDatabase
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import APIKeyHeader
import os
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("maigret-worker")

# Global state
app_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load Maigret database at startup
    logger.info("Loading Maigret database...")
    try:
        app_state["db"] = MaigretDatabase().load_from_path("maigret/resources/data.json")
        logger.info(f"Loaded {len(app_state['db'].sites)} sites")
    except Exception as e:
        logger.error(f"Failed to load Maigret database: {e}")
        raise

    yield

    # Cleanup
    app_state.clear()

app = FastAPI(
    title="Maigret Worker",
    description="Public profile scanning service",
    lifespan=lifespan
)

api_key_header = APIKeyHeader(name="X-API-Key")

# Semaphore to limit concurrent scans
SCAN_SEMAPHORE = asyncio.Semaphore(5)  # Max 5 concurrent scans

async def verify_api_key(key: str = Security(api_key_header)):
    expected = os.getenv("MAIGRET_WORKER_SECRET")
    if not expected or key != expected:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return key

@app.get("/health")
async def health():
    db_loaded = "db" in app_state
    return {
        "status": "healthy" if db_loaded else "degraded",
        "service": "maigret-worker",
        "db_loaded": db_loaded
    }

@app.post("/scan")
async def scan(
    username: str,
    top_sites: int = 500,
    parse: bool = True,
    _: str = Depends(verify_api_key)
):
    """
    Scan public profiles for a given username using Maigret.
    Returns normalized results with platform info and extracted data.
    """
    # Validate input
    if not username or len(username) > 100:
        raise HTTPException(status_code=400, detail="Invalid username")

    if top_sites < 1 or top_sites > 10000:
        top_sites = 500

    # Acquire semaphore to limit concurrency
    async with SCAN_SEMAPHORE:
        try:
            logger.info(f"Scanning username: {username}, top_sites={top_sites}, parse={parse}")

            # Get cached database
            db = app_state.get("db")
            if not db:
                logger.warning("Database not cached, loading now...")
                db = MaigretDatabase().load_from_path("maigret/resources/data.json")
                app_state["db"] = db

            sites = db.ranked_sites_dict(top=top_sites)

            # Run search in thread pool to avoid blocking event loop
            loop = asyncio.get_event_loop()
            results = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: maigret_search(
                        username=username,
                        site_dict=sites,
                        logger=logger,
                        timeout=30,
                        is_parsing_enabled=parse,
                    )
                ),
                timeout=60.0  # Overall timeout for the scan
            )

            # Normalize results
            platforms = []
            for site_name, result in results.items():
                if result["status"].is_found():
                    platform_info = {
                        "platform": site_name,
                        "url": result.get("url_user"),
                        "exists": True,
                        "http_status": result.get("http_status"),
                        "rank": result.get("rank"),
                    }
                    # Include parsed IDs data if available
                    if parse and "ids_data" in result:
                        platform_info["ids_data"] = result["ids_data"]
                    platforms.append(platform_info)

            confidence = min(len(platforms) * 0.2, 1.0)
            summary = (
                f"Public presence suggests activity on {len(platforms)} platforms"
                if platforms else "No public profiles found"
            )

            return {
                "summary": summary,
                "platforms": platforms,
                "confidence": confidence,
                "username": username,
            }

        except asyncio.TimeoutError:
            logger.error(f"Scan timeout for username: {username}")
            raise HTTPException(status_code=504, detail="Scan timeout")
        except Exception as e:
            logger.error(f"Scan error: {str(e)}")
            raise HTTPException(status_code=500, detail="Scan failed. Please try again.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
