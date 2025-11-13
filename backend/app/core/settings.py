from functools import lru_cache
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Orígenes permitidos para CORS
    cors_origins: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Ruta relativa (desde app/) a la plantilla Excel
    data_template_path: str = "data/PLANTILLA_VI.xlsx"

    class Config:
        env_prefix = "VI_"
        env_file = ".env"

    @property
    def template_abs_path(self) -> str:
        """Ruta absoluta de la plantilla en runtime"""
        base = Path(__file__).resolve().parents[1]  # .../backend/app
        return str((base / self.data_template_path).resolve())
    
@lru_cache
def get_settings() -> Settings:
    return Settings()