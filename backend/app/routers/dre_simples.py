from fastapi import APIRouter, HTTPException, Depends
from app.models.dre_simples import DRESimplificadaInput, DRESimplificadaResult
from app.services.dre_simples_calculator import calcular_dre_simples
from app.routers.auth import get_current_user
import database as db

router = APIRouter(prefix="/dre/simples", tags=["DRE Simplificada"])


@router.post("/calcular", response_model=DRESimplificadaResult)
async def calcular_simples(data: DRESimplificadaInput):
    return calcular_dre_simples(data)


@router.post("/salvar")
async def salvar_simples(
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    input_data = payload.get("input")
    result_data = payload.get("resultado")
    if not input_data or not result_data:
        raise HTTPException(status_code=400, detail="Campos 'input' e 'resultado' obrigatórios")

    mes = result_data.get("mes")
    ano = result_data.get("ano")
    if not mes or not ano:
        raise HTTPException(status_code=400, detail="Campos 'mes' e 'ano' obrigatórios")

    db.save_dre_mes(current_user["username"], mes, ano, input_data, result_data, tipo="simples")
    return {"ok": True, "mes": mes, "ano": ano}


@router.get("/historico")
async def historico_simples(current_user: dict = Depends(get_current_user)):
    return db.list_dre_meses(current_user["username"], tipo="simples")


@router.delete("/historico/{ano}/{mes}")
async def deletar_simples(
    ano: int,
    mes: int,
    current_user: dict = Depends(get_current_user),
):
    ok = db.delete_dre_mes(current_user["username"], mes, ano, tipo="simples")
    if not ok:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    return {"ok": True}
