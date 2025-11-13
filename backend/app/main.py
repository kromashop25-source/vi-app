from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.settings import get_settings
from app.api import catalogs, auth, oi
from app.core.db import init_db

app = FastAPI(title="VI Backend")
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

app.include_router(catalogs.router, prefix="/catalogs", tags=["catalogs"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(oi.router, prefix="/oi", tags=["oi"])

@app.on_event("startup")
def _startup() -> None:
    init_db()
    