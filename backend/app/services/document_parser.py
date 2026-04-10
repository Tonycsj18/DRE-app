import re
import xml.etree.ElementTree as ET
import pdfplumber
import pandas as pd
from io import BytesIO
from typing import Any


# ── Helpers ────────────────────────────────────────────────────────────────────

def _float(value: str | None) -> float:
    """Converte string para float de forma segura."""
    if not value:
        return 0.0
    try:
        return float(value.replace(",", "."))
    except (ValueError, AttributeError):
        return 0.0


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


# ── Parser NF-e XML ────────────────────────────────────────────────────────────

# Namespace padrão da NF-e
_NS = {"nfe": "http://www.portalfiscal.inf.br/nfe"}


def _xml_get(el, path: str) -> str | None:
    """Busca texto de um elemento XML com namespace."""
    found = el.find(path, _NS)
    return found.text if found is not None else None


def parse_nfe_xml(conteudo: bytes) -> dict[str, Any]:
    """
    Extrai dados financeiros de um XML de NF-e e mapeia para os campos do DRE.

    Mapeamento:
    - NF-e de SAÍDA  (tpNF=1): vNF → receita_bruta, vICMS+vPIS+vCOFINS → impostos_vendas
    - NF-e de ENTRADA (tpNF=0): vNF → compras (dentro de total_compras → produtos_prontos)
    """
    dados: dict[str, float] = {}

    try:
        root = ET.fromstring(conteudo)

        # Suporta tanto <NFe> direto quanto <nfeProc><NFe>
        infNFe = root.find(".//nfe:infNFe", _NS)
        if infNFe is None:
            return {}

        # Tipo: 0=Entrada, 1=Saída
        tp_nf = _xml_get(infNFe, "nfe:ide/nfe:tpNF") or "1"

        # Totais
        total = infNFe.find("nfe:total/nfe:ICMSTot", _NS)
        if total is None:
            return {}

        v_nf      = _float(_xml_get(total, "nfe:vNF"))
        v_icms    = _float(_xml_get(total, "nfe:vICMS"))
        v_pis     = _float(_xml_get(total, "nfe:vPIS"))
        v_cofins  = _float(_xml_get(total, "nfe:vCOFINS"))
        v_desc    = _float(_xml_get(total, "nfe:vDesc"))
        v_frete   = _float(_xml_get(total, "nfe:vFrete"))

        impostos = v_icms + v_pis + v_cofins

        if tp_nf == "1":  # SAÍDA = Venda
            dados["receita_bruta"] = v_nf
            if impostos > 0:
                dados["impostos_vendas"] = impostos
            if v_desc > 0:
                dados["devolucoes"] = v_desc
        else:  # ENTRADA = Compra
            # Mapeia para produtos_prontos (compras de mercadoria)
            dados["compras"] = v_nf
            if v_frete > 0:
                dados["royalties_frete"] = v_frete

    except ET.ParseError:
        pass

    return dados


# ── Parser DANFE PDF ───────────────────────────────────────────────────────────

def parse_danfe_pdf(texto: str) -> dict[str, Any]:
    """
    Parser especializado para DANFE (Documento Auxiliar da NF-e).
    Detecta pelo cabeçalho DANF-e ou NF-e e extrai os totais da nota.
    """
    dados: dict[str, float] = {}

    texto_lower = texto.lower()

    # Detecta se é DANFE
    eh_danfe = any(p in texto_lower for p in ["danf-e", "danfe", "nota fiscal eletrônica", "nota fiscal eletronica", "nf-e"])
    if not eh_danfe:
        return {}

    # Tipo: Saída (1) ou Entrada (0)
    eh_saida = "1 - saída" in texto_lower or "1-saída" in texto_lower or "1 - saida" in texto_lower

    # Extrai VALOR TOTAL DA NOTA
    # Padrões comuns no DANFE
    padroes_total = [
        r"valor\s+total\s+da\s+nota\s*[:\s]*([\d.,]+)",
        r"valor\s+total\s+nf\s*[:\s]*([\d.,]+)",
        r"v\.?\s*total\s*[:\s]*([\d.,]+)",
        r"total\s+da\s+nota\s*[:\s]*([\d.,]+)",
    ]
    v_total = 0.0
    for p in padroes_total:
        m = re.search(p, texto_lower)
        if m:
            v_total = _float(m.group(1).replace(".", "").replace(",", "."))
            if v_total > 0:
                break

    # Extrai VALOR DO ICMS
    padroes_icms = [
        r"valor\s+do\s+icms\s*[:\s]*([\d.,]+)",
        r"v\.?\s*icms\s*[:\s]*([\d.,]+)",
    ]
    v_icms = 0.0
    for p in padroes_icms:
        m = re.search(p, texto_lower)
        if m:
            v_icms = _float(m.group(1).replace(".", "").replace(",", "."))
            if v_icms > 0:
                break

    # Extrai VALOR DO DESCONTO
    padroes_desc = [
        r"valor\s+do\s+desconto\s*[:\s]*([\d.,]+)",
        r"v\.?\s*desc\.?\s*[:\s]*([\d.,]+)",
    ]
    v_desc = 0.0
    for p in padroes_desc:
        m = re.search(p, texto_lower)
        if m:
            v_desc = _float(m.group(1).replace(".", "").replace(",", "."))
            if v_desc > 0:
                break

    # Fallback: extrai da linha de totais do DANFE
    # Formato típico: "BASE_ICMS  V_ICMS  BASE_ST  V_ST  V_PROD"
    # Seguida de:     "V_FRETE  V_SEG  V_DESC  V_OUTRAS  V_IPI  V_TOTAL"
    if v_total == 0:
        # Tenta encontrar "valor total da nota" após uma sequência de números na mesma linha
        # No DANFE o layout é: BCICMS VICMS BCST VST VPROD na linha 1
        #                       VFRETE VSEG VDESC VOUTRAS VIPI VTOTAL na linha 2
        m = re.search(
            r"valor\s+total\s+dos\s+produtos\s*\n[\s\d.,]+\n"   # linha 1
            r"[\d.,]+\s+r?\$?\s*[\d.,]+\s+[\d.,]+\s+[\d.,]+\s+[\d.,]+\s+([\d.,]+)",  # linha 2 → último = VTOTAL
            texto_lower
        )
        if m:
            v_total = _float(m.group(1).replace(".", "").replace(",", "."))

        # Busca mais simples: "valor total da nota\n ... 252,29"
        if v_total == 0:
            m = re.search(r"valor\s+total\s+da\s+nota\s*\n\s*([\d.,]+)", texto_lower)
            if m:
                v_total = _float(m.group(1).replace(".", "").replace(",", "."))

        # Ainda zero: busca "VTOTAL" após linha de cálculo do imposto
        if v_total == 0:
            # Pega todos os números maiores que 0 após a seção de cálculo
            secao = re.search(r"c[áa]lculo\s+do\s+imposto(.*?)transportador", texto_lower, re.DOTALL)
            if secao:
                nums = re.findall(r"(\d{1,3}(?:\.\d{3})*,\d{2})", secao.group(1))
                if nums:
                    # O maior número costuma ser o valor total
                    valores = [_float(n.replace(".", "").replace(",", ".")) for n in nums]
                    v_total = max(valores)

        # Tenta pegar o ICMS da mesma seção
        if v_icms == 0 and v_total > 0:
            secao = re.search(r"c[áa]lculo\s+do\s+imposto(.*?)transportador", texto_lower, re.DOTALL)
            if secao:
                nums = re.findall(r"(\d{1,3}(?:\.\d{3})*,\d{2})", secao.group(1))
                if len(nums) >= 2:
                    valores = sorted([_float(n.replace(".", "").replace(",", ".")) for n in nums])
                    # O segundo maior costuma ser o ICMS (menor que o total)
                    candidatos = [v for v in valores if 0 < v < v_total]
                    if candidatos:
                        v_icms = candidatos[-1]

    if v_total > 0:
        if eh_saida:
            dados["receita_bruta"] = v_total
            if v_icms > 0:
                dados["impostos_vendas"] = v_icms
            if v_desc > 0:
                dados["devolucoes"] = v_desc
        else:
            dados["compras"] = v_total

    return dados


# ── Parser PDF genérico ────────────────────────────────────────────────────────

def parse_pdf(conteudo: bytes) -> dict[str, Any]:
    """Extrai dados financeiros de um PDF (DANFE ou relatório genérico)."""
    dados: dict[str, float] = {}
    texto_completo = ""

    with pdfplumber.open(BytesIO(conteudo)) as pdf:
        for pagina in pdf.pages:
            texto = pagina.extract_text() or ""
            texto_completo += texto + "\n"

    # Tenta o parser de DANFE primeiro
    dados_danfe = parse_danfe_pdf(texto_completo)
    if dados_danfe:
        return dados_danfe

    # Fallback: relatório financeiro genérico
    texto_lower = texto_completo.lower()
    mapeamento = {
        "receita_bruta": ["receita bruta", "faturamento bruto", "vendas brutas"],
        "devolucoes": ["devoluções", "devolucao", "cancelamentos"],
        "impostos_vendas": ["impostos sobre vendas"],
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
            valor = extrair_valor(texto_lower, chave)
            if valor > 0:
                dados[campo] = valor
                break

    return dados


# ── Parser Excel ───────────────────────────────────────────────────────────────

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


# ── Dispatcher principal ───────────────────────────────────────────────────────

def processar_documento(nome_arquivo: str, conteudo: bytes) -> dict[str, Any]:
    """Direciona o processamento pelo tipo de arquivo."""
    extensao = nome_arquivo.lower().split(".")[-1]

    if extensao == "xml":
        return parse_nfe_xml(conteudo)
    elif extensao == "pdf":
        return parse_pdf(conteudo)
    elif extensao in ("xlsx", "xls"):
        return parse_excel(conteudo)
    else:
        return {}
