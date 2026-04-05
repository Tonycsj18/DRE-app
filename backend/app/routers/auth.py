import os
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from jose import jwt
from passlib.context import CryptContext

router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "dre-app-secret-key-mude-em-producao")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 8

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Usuário principal via variáveis de ambiente
USUARIOS: dict[str, str] = {
    os.getenv("APP_USERNAME", "admin"): os.getenv("APP_PASSWORD", "dre@2024"),
}

# Usuários adicionais via variável de ambiente APP_USERS (JSON)
# Formato: {"cafecultura": "cafe01", "outro": "senha"}
_extra = os.getenv("APP_USERS", "")
if _extra:
    try:
        USUARIOS.update(json.loads(_extra))
    except Exception:
        pass


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest):
    senha_correta = USUARIOS.get(data.username)

    if not senha_correta or data.password != senha_correta:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos",
        )

    payload = {
        "sub": data.username,
        "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": token, "token_type": "bearer"}
