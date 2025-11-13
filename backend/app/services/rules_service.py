from datetime import date
from typing import Optional, Iterable, List

# Reglas PMA -> Presión (bar) (valores cerrados)
PMA_TO_PRESSURE = {
    16: 25.6,
    10: 16.0,

}

def pma_to_pressure(pma: Optional[float]) -> Optional[float]:
    """Convierte PMA a Presión(bar). Devuelve None si no hay regla definida."""
    if pma is None:
        return None
    try:
        key = int(float(pma))
    except (TypeError, ValueError):
        return None
    return PMA_TO_PRESSURE.get(key)

def iso_today() -> str:
    """Fecha actual en ISO YYYY-MM-DD."""
    return date.today().isoformat()

# Normalización de cadenas para casar con lista de Excel (coma decimal, trim)
def normalize_for_excel_list(value: Optional[str | float | int]) -> Optional[str]:
    if value is None:
        return None
    s = str(value).strip()
    # punto -> coma decimal
    if "," not in s and "." in s:
        # sólo cambiar si parece número
        try:
            float(s)
            s = s.replace(".", ",")
        except ValueError:
            pass
    return s

def find_exact_in_range(values: Iterable[str], desired: str) -> Optional[str]:
    """Retorna el item exacto (texto) dentro de values que coincide con desired tras normalización."""
    target = normalize_for_excel_list(desired)
    if target is None:
        return None
    for v in values:
        if v is None:
            continue
        if str(v).strip() == target:
            return str(v).strip()
    return None