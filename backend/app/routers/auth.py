import os
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import jwt, JWTError
import database as db

router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "dre-app-secret-key-mude-em-producao")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 8

security = HTTPBearer()


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    is_admin: bool


def create_token(username: str, is_admin: bool) -> str:
    payload = {
        "sub": username,
        "is_admin": is_admin,
        "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Token inválido")
        return {"username": username, "is_admin": bool(payload.get("is_admin", False))}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if not current_user["is_admin"]:
        raise HTTPException(status_code=403, detail="Acesso restrito ao administrador")
    return current_user


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest):
    user = db.get_user(data.username)
    if not user or not db.verify_password(data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos",
        )
    token = create_token(user["username"], bool(user["is_admin"]))
    return {"access_token": token, "token_type": "bearer", "is_admin": bool(user["is_admin"])}
