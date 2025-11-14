import re
from io import BytesIO
from typing import List, cast

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from ..core.db import engine
from ..models import OI, Bancada
from ..schemas import OICreate, OIRead, OiWithBancadasRead, BancadaCreate, BancadaRead
from ..services.excel_service import generate_excel as build_excel_file
from ..services.rules_service import pma_to_pressure
from pydantic import BaseModel

router = APIRouter()


OI_CODE_RE = re.compile(r"^OI-\d{4}-\d{4}$")

def get_session():
    with Session(engine) as session:
        yield session

@router.post("", response_model=OIRead)
def create_oi(payload: OICreate, session: Session = Depends(get_session)):
    # Validación estricta del patrón OI
    if not OI_CODE_RE.match(payload.code):
        raise HTTPException(status_code=422, detail="Código OI inválido (formato OI-####-YYYY).")
    presion = pma_to_pressure(payload.pma)
    if presion is None:
        raise HTTPException(status_code=422, detail="PMA inválido (solo se aceptan 10 o 16).")
    oi = OI(
        code=payload.code,
        q3=payload.q3,
        alcance=payload.alcance,
        pma=payload.pma,
        presion_bar=presion,
        banco_id=payload.banco_id,
        tech_number=payload.tech_number,
    )
    session.add(oi)
    session.commit()
    session.refresh(oi)
    return oi

@router.get("/{oi_id}", response_model=OIRead)
def get_oi(oi_id: int, session: Session = Depends(get_session)):
    oi = session.get(OI, oi_id)
    if not oi:
        raise HTTPException(status_code=404, detail="OI no encontrada")
    return oi

@router.get("", response_model=List[OIRead])
def list_oi(limit: int = 50, offset: int = 0, session: Session = Depends(get_session)):
    q = select(OI).limit(limit).offset(offset)
    return list(session.exec(q))

class ExcelRequest(BaseModel):
    password: str

@router.post("/{oi_id}/bancadas", response_model=BancadaRead)
def add_bancada(oi_id: int, payload: BancadaCreate, session: Session = Depends(get_session)):
    oi = session.get(OI, oi_id)
    if not oi:
        raise HTTPException(status_code=404, detail="OI no encontrada")
    # Autonumeración segura
    existing_items = session.exec(
        select(Bancada.item).where(Bancada.oi_id == oi_id)
    ).all()
    next_item = (max([x or 0 for x in existing_items]) if existing_items else 0) + 1
    b = Bancada(
        oi_id=oi_id,
        item=next_item,
        medidor=payload.medidor,
        estado=payload.estado,
        rows=payload.rows,
        # Mini-planilla completa de la bancada (si el frontend la envía)
        rows_data=payload.rows_data,
    )
    session.add(b)
    session.commit()
    session.refresh(b)
    return BancadaRead.model_validate(b)

@router.get("/{oi_id}/with-bancadas", response_model=OiWithBancadasRead)
def get_oi_with_bancadas(oi_id: int, session: Session = Depends(get_session)):
    oi = session.get(OI, oi_id)
    if not oi:
        raise HTTPException(status_code=404, detail="OI no encontrada")
    rows = list(session.exec(select(Bancada).where(Bancada.oi_id == oi_id)))
    rows.sort(key=lambda x: (x.item or 0))
    oi_id_int = cast(int, oi.id)
    return OiWithBancadasRead(
        id=oi_id_int,
        code=oi.code,
        q3=oi.q3,
        alcance=oi.alcance,
        pma=oi.pma,
        presion_bar=oi.presion_bar,
        banco_id=oi.banco_id,
        tech_number=oi.tech_number,
        bancadas=[BancadaRead.model_validate(b) for b in rows],
    )

# Alias para el frontend: /oi/{id}/full → mismo payload que /with-bancadas
@router.get("/{oi_id}/full", response_model=OiWithBancadasRead)
def get_oi_full(oi_id: int, session: Session = Depends(get_session)):
    return get_oi_with_bancadas(oi_id, session)

@router.put("/bancadas/{bancada_id}", response_model=BancadaRead)
def update_bancada(bancada_id: int, payload: BancadaCreate, session: Session = Depends(get_session)):
    b = session.get(Bancada, bancada_id)
    if not b:
        raise HTTPException(status_code=404, detail="Bancada no encontrada")
    b.medidor = payload.medidor
    b.estado = payload.estado or 0
    b.rows = payload.rows
    # Reemplazar grid por la versión más reciente que viene del modal.
    # Si el frontend aún no envía rows_data, esto quedará en None.
    b.rows_data = payload.rows_data
    session.add(b)
    session.commit()
    session.refresh(b)
    return BancadaRead.model_validate(b)

@router.delete("/bancadas/{bancada_id}")
def delete_bancada(bancada_id: int, session: Session = Depends(get_session)):
    b = session.get(Bancada, bancada_id)
    if not b:
        raise HTTPException(status_code=404, detail="Bancada no encontrada")
    session.delete(b)
    session.commit()
    return {"ok": True}

@router.post("/{oi_id}/excel")
def export_excel(oi_id: int, req: ExcelRequest, session: Session = Depends(get_session)):
    oi = session.get(OI, oi_id)
    if not oi:
        raise HTTPException(status_code=404, detail="OI no encontrada")
    bancadas = list(session.exec(select(Bancada).where(Bancada.oi_id == oi_id)))
    bancadas.sort(key=lambda x: (x.item or 0))
    # Si la plantilla no encuentra coincidencias exactas en E4/O4, devolver 422 (no 500)
    try:
        data, filename = build_excel_file(oi, bancadas, password=req.password)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return StreamingResponse(
        BytesIO(data),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{oi_id}/bancadas-list", response_model=List[BancadaRead])
def list_bancadas(oi_id: int, session: Session = Depends(get_session)):
    rows = list(session.exec(select(Bancada).where(Bancada.oi_id == oi_id)))
    rows.sort(key=lambda x: (x.item or 0))
    # Asegura serialización consistente con el schema
    return [BancadaRead.model_validate(b) for b in rows]