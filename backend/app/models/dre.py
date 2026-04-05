from pydantic import BaseModel
from typing import Optional


class DREInput(BaseModel):
    receita_bruta: float = 0.0
    devolucoes: float = 0.0
    abatimentos: float = 0.0
    impostos_vendas: float = 0.0  # ICMS, PIS, COFINS, ISS
    estoque_inicial: float = 0.0
    compras: float = 0.0
    estoque_final: float = 0.0
    despesas_comerciais: float = 0.0
    despesas_administrativas: float = 0.0
    despesas_financeiras: float = 0.0
    receitas_financeiras: float = 0.0
    depreciacao_amortizacao: float = 0.0
    resultado_nao_operacional: float = 0.0
    aliquota_irpj: float = 0.15
    aliquota_csll: float = 0.09
    participacoes: float = 0.0


class DREResult(BaseModel):
    # Receitas
    receita_bruta: float
    deducoes_receita: float
    receita_liquida: float

    # Custos
    cmv: float
    lucro_bruto: float

    # Despesas
    despesas_operacionais: float
    despesas_comerciais: float
    despesas_administrativas: float
    despesas_financeiras_liquidas: float

    # Resultados intermediários
    ebitda: float
    depreciacao_amortizacao: float
    ebit: float

    # Resultado final
    resultado_nao_operacional: float
    lair: float
    provisao_irpj: float
    provisao_csll: float
    participacoes: float
    lucro_liquido: float

    # Margem
    margem_bruta: Optional[float] = None
    margem_liquida: Optional[float] = None
