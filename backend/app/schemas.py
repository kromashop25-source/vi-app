from typing import Optional, List, Literal, Annotated
from pydantic import BaseModel, Field, ConfigDict, StringConstraints

OI_CODE_PATTERN = r"^OI-\d{4}-\d{4}$"


class OICreate(BaseModel):
    code: Annotated[str, StringConstraints(pattern=OI_CODE_PATTERN, strip_whitespace=True)]
    q3: float
    alcance: int
    pma: Literal[10, 16]
    banco_id: int
    tech_number: int

class OIRead(BaseModel):
    id: int
    code: str
    q3: float
    alcance: int
    pma: int
    presion_bar: float
    banco_id: int
    tech_number: int

class BancadaBase(BaseModel):
    medidor: Optional[str] = None
    estado: int = Field(default=0, ge=0, le=5)
    rows: int = Field(default=15, ge=1)  # mínimo 1, por defecto 15
    # Grid de filas por bancada (mini-planilla). Cada elemento es una fila con
    # sus campos (# medidor, Q3, Q2, Q1, etc.), serializada como dict.
    rows_data: Optional[List[dict]] = None


class BancadaCreate(BancadaBase):
    pass


class BancadaRead(BancadaBase):
    id: int
    item: int
    model_config = ConfigDict(from_attributes=True)


class OiWithBancadasRead(OIRead):
    bancadas: List[BancadaRead] = Field(default_factory=list)
