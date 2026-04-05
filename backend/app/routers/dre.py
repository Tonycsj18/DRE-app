from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List
from app.models.dre import DREInput, DREResult
from app.services.dre_calculator import calcular_dre
from app.services.document_parser import processar_documento
from app.routers.auth import get_current_user
import database as db

router = APIRouter(prefix="/dre", tags=["DRE"])


@router.post("/calcular", response_model=DREResult)
async def calcular(data: DREInput):
    return calcular_dre(data)


@router.post("/upload")
async def upload_documentos(arquivos: List[UploadFile] = File(...)):
    dados_extraidos: dict = {}
    for arquivo in arquivos:
        extensao = arquivo.filename.lower().split(".")[-1] if arquivo.filename else ""
        if extensao not in ("pdf", "xlsx", "xls"):
            raise HTTPException(status_code=400, detail=f"Arquivo '{arquivo.filename}' não suportado.")
        conteudo = await arquivo.read()
        dados = processar_documento(arquivo.filename or "", conteudo)
        for campo, valor in dados.items():
            dados_extraidos[campo] = dados_extraidos.get(campo, 0) + valor
    return JSONResponse(content={"dados_extraidos": dados_extraidos})


# ── Endpoints autenticados ─────────────────────────────────────────────────────

@router.post("/salvar")
async def salvar_mes(
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    """Salva ou atualiza o resultado de um mês para o usuário autenticado."""
    input_data = payload.get("input")
    result_data = payload.get("resultado")
    if not input_data or not result_data:
        raise HTTPException(status_code=400, detail="Campos 'input' e 'resultado' obrigatórios")

    mes = result_data.get("mes")
    ano = result_data.get("ano")
    if not mes or not ano:
        raise HTTPException(status_code=400, detail="Campos 'mes' e 'ano' obrigatórios no resultado")

    db.save_dre_mes(current_user["username"], mes, ano, input_data, result_data)
    return {"ok": True, "mes": mes, "ano": ano}


@router.get("/historico")
async def historico(current_user: dict = Depends(get_current_user)):
    """Retorna todos os meses salvos do usuário autenticado."""
    return db.list_dre_meses(current_user["username"])


@router.delete("/historico/{ano}/{mes}")
async def deletar_mes(
    ano: int,
    mes: int,
    current_user: dict = Depends(get_current_user),
):
    """Remove um mês do histórico do usuário autenticado."""
    ok = db.delete_dre_mes(current_user["username"], mes, ano)
    if not ok:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    return {"ok": True}
