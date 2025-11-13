from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user(credentials:HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    """ Stub de autenticación: valida que llegue un Bearer token.
        Reemplazar por JWT real más adelante.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # TODO: decodificar/valida token y retornar el usuario real
    return {"username": "demo", "techNumber": "T-000", "bancoId": 1}
    
