from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class OI(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str # OI-####-YYYY
    q3: float
    alcance: int
    pma: int
    presion_bar: float
    banco_id: int
    tech_number: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

    bancadas: List["Bancada"] = Relationship(back_populates="oi")

class Bancada(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    oi_id: int = Field(foreign_key="oi.id")
    item: int                       # autonum (1..n)
    # Campos mínimos de ejemplo (agrega los reales luego)
    medidor: Optional[str] = None
    estado: int = Field(default=0, ge=0, le=5)                 # 0..5 (editable; default 0
    rows: int = Field(default=15, ge=1)

    oi: Optional[OI] = Relationship(back_populates="bancadas")