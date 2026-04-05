from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import List
from app.models.dre import DREInput, DREResult
from app.services.dre_calculator import calcular_dre
from app.services.document_parser import processar_documento

router = APIRouter(prefix="/dre", tags=["DRE"])


@router.post("/calcular", response_model=DREResult)
async def calcular(data: DREInput):
    """Calcula a DRE a partir de valores informados manualmente."""
    return calcular_dre(data)


@router.post("/upload")
async def upload_documentos(arquivos: List[UploadFile] = File(...)):
    """
    Recebe documentos (PDFs ou planilhas), extrai os dados financeiros
    e retorna os valores encontrados para revisão antes do cálculo.
    """
    dados_extraidos: dict = {}

    for arquivo in arquivos:
        extensao = arquivo.filename.lower().split(".")[-1] if arquivo.filename else ""
        if extensao not in ("pdf", "xlsx", "xls"):
            raise HTTPException(
                status_code=400,
                detail=f"Arquivo '{arquivo.filename}' não suportado. Use PDF ou Excel.",
            )

        conteudo = await arquivo.read()
        dados = processar_documento(arquivo.filename or "", conteudo)

        # Mescla: se um campo já existe, soma os valores
        for campo, valor in dados.items():
            if campo in dados_extraidos:
                dados_extraidos[campo] = dados_extraidos[campo] + valor
            else:
                dados_extraidos[campo] = valor

    return JSONResponse(content={"dados_extraidos": dados_extraidos})


@router.post("/upload-e-calcular", response_model=DREResult)
async def upload_e_calcular(arquivos: List[UploadFile] = File(...)):
    """
    Recebe documentos, extrai os dados e já retorna a DRE calculada.
    """
    dados_extraidos: dict = {}

    for arquivo in arquivos:
        conteudo = await arquivo.read()
        dados = processar_documento(arquivo.filename or "", conteudo)
        for campo, valor in dados.items():
            dados_extraidos[campo] = dados_extraidos.get(campo, 0) + valor

    dre_input = DREInput(**dados_extraidos)
    return calcular_dre(dre_input)
