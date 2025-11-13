from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import secrets, logging

router = APIRouter()

# Usuarios de ejemplo
_USERS = {
    "admin":     {"password": "1234", "techNumber": 101},
    "inspector": {"password": "medileser", "techNumber": 2},
}

# Sesiones en memoria: token -> payload
_SESSIONS: dict[str, dict] = {}

class LoginIn(BaseModel):
    username: str
    password: str
    bancoId: int

class LoginOut(BaseModel):
    username: str
    bancoId: int
    token: str
    techNumber: int

@router.post("/login", response_model=LoginOut)
def login(payload: LoginIn):
    username = payload.username.strip().lower()
    password = payload.password.strip()
    u = _USERS.get(username)
    if not u or u["password"] != password:
        logging.warning("Login fallido user=%r", username)
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = secrets.token_urlsafe(24)
    sess = {"user": username, "username": username, "bancoId": payload.bancoId, 
            "token": token, "techNumber": u["techNumber"]}
    _SESSIONS[token] = sess
    return sess

@router.get("/me", response_model=LoginOut)
def me(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    token = authorization.split(" ", 1)[1]
    sess = _SESSIONS.get(token)
    if not sess:
        raise HTTPException(status_code=401, detail="Token inválido")
    # garantizar que tenga ambas claves
    if "username" not in sess and "user" in sess:
        sess["username"] = sess["user"]
    if "user" not in sess and "username" in sess:
        sess["user"] = sess["username"]
    return sess
    