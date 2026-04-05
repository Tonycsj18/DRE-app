import re
import pdfplumber
import openpyxl
import pandas as pd
from io import BytesIO
from typing import Any


def extrair_valor(texto: str, chave: str) -> float:
    """Tenta extrair um valor numérico próximo a uma palavra-chave no texto."""
    padrao = rf"{chave}[^\d\n]*([\d.,]+)"
    match = re.search(padrao, texto, re.IGNORECASE)
    if match:
        valor_str = match.group(1).replace(".", "").replace(",", ".")
        try:
            return float(valor_str)
        except ValueError:
            return 0.0
    return 0.0


def parse_pdf(conteudo: bytes) -> dict[str, Any]:
    """Extrai dados financeiros de um PDF."""
    dados: dict[str, float] = {}
    texto_completo = ""

    with pdfplumber.open(BytesIO(conteudo)) as pdf:
        for pagina in pdf.pages:
            texto = pagina.extract_text() or ""
            texto_completo += texto + "\n"

    mapeamento = {
        "receita_bruta": ["receita bruta", "faturamento bruto", "vendas brutas"],
        "devolucoes": ["devoluções", "devolucao", "cancelamentos"],
        "impostos_vendas": ["impostos sobre vendas", "icms", "pis", "cofins", "iss"],
        "estoque_inicial": ["estoque inicial"],
        "compras": ["compras", "custo de compras"],
        "estoque_final": ["estoque final"],
        "despesas_comerciais": ["despesas comerciais", "despesas de vendas"],
        "despesas_administrativas": ["despesas administrativas", "despesas gerais"],
        "despesas_financeiras": ["despesas financeiras", "juros pagos"],
        "receitas_financeiras": ["receitas financeiras", "juros recebidos"],
        "depreciacao_amortizacao": ["depreciação", "amortização", "depreciacao"],
        "resultado_nao_operacional": ["resultado não operacional", "outras receitas"],
    }

    for campo, palavras_chave in mapeamento.items():
        for chave in palavras_chave:
            valor = extrair_valor(texto_completo, chave)
            if valor > 0:
                dados[campo] = valor
                break

    return dados


def parse_excel(conteudo: bytes) -> dict[str, Any]:
    """Extrai dados financeiros de uma planilha Excel."""
    dados: dict[str, float] = {}

    try:
        df = pd.read_excel(BytesIO(conteudo), header=None)
        texto_completo = df.to_string().lower()

        mapeamento = {
            "receita_bruta": ["receita bruta", "faturamento", "vendas"],
            "devolucoes": ["devoluções", "devolucao"],
            "impostos_vendas": ["impostos", "icms", "pis", "cofins"],
            "estoque_inicial": ["estoque inicial"],
            "compras": ["compras"],
            "estoque_final": ["estoque final"],
            "despesas_comerciais": ["despesas comerciais"],
            "despesas_administrativas": ["despesas administrativas"],
            "despesas_financeiras": ["despesas financeiras"],
            "receitas_financeiras": ["receitas financeiras"],
            "depreciacao_amortizacao": ["depreciação", "depreciacao"],
        }

        for campo, palavras_chave in mapeamento.items():
            for chave in palavras_chave:
                valor = extrair_valor(texto_completo, chave)
                if valor > 0:
                    dados[campo] = valor
                    break
    except Exception:
        pass

    return dados


def processar_documento(nome_arquivo: str, conteudo: bytes) -> dict[str, Any]:
    """Direciona o processamento pelo tipo de arquivo."""
    extensao = nome_arquivo.lower().split(".")[-1]

    if extensao == "pdf":
        return parse_pdf(conteudo)
    elif extensao in ("xlsx", "xls"):
        return parse_excel(conteudo)
    else:
        return {}
