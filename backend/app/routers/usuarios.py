from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.routers.auth import require_admin
import database as db

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


class CriarUsuarioRequest(BaseModel):
    username: str
    password: str
    is_admin: bool = False


class AlterarSenhaRequest(BaseModel):
    password: str


@router.get("")
def listar_usuarios(current_user: dict = Depends(require_admin)):
    return db.list_users()


@router.post("")
def criar_usuario(data: CriarUsuarioRequest, current_user: dict = Depends(require_admin)):
    ok = db.create_user(data.username, data.password, data.is_admin)
    if not ok:
        raise HTTPException(status_code=409, detail="Usuário já existe")
    return {"ok": True, "username": data.username}


@router.delete("/{username}")
def deletar_usuario(username: str, current_user: dict = Depends(require_admin)):
    if username == current_user["username"]:
        raise HTTPException(status_code=400, detail="Não é possível excluir o próprio usuário")
    ok = db.delete_user(username)
    if not ok:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"ok": True}


@router.patch("/{username}/senha")
def alterar_senha(username: str, data: AlterarSenhaRequest, current_user: dict = Depends(require_admin)):
    ok = db.update_password(username, data.password)
    if not ok:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"ok": True}
