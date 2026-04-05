from pydantic import BaseModel
from typing import Optional


class DREInput(BaseModel):
    # Receita
    receita_bruta: float = 0.0

    # Deduções da Receita
    impostos_vendas: float = 0.0       # ICMS, PIS, COFINS, ISS
    taxas_aplicativos: float = 0.0     # iFood, Rappi, etc.
    tarifas_cartoes: float = 0.0       # taxas de cartão de crédito/débito
    cancelamentos_estornos: float = 0.0  # cancelamentos, estornos, descontos

    # CMV - Custo da Mercadoria Vendida
    estoque_inicial: float = 0.0
    compras: float = 0.0               # alimentos, bebidas, embalagens, descartáveis
    estoque_final: float = 0.0

    # Despesas Operacionais
    folha_pagamento: float = 0.0       # salários + encargos trabalhistas
    aluguel: float = 0.0               # aluguel + condomínio (custos de ocupação)
    energia_agua_gas: float = 0.0      # energia elétrica, água, gás
    marketing: float = 0.0             # marketing e publicidade
    manutencao: float = 0.0            # manutenção de equipamentos
    despesas_administrativas: float = 0.0  # sistemas, internet, administrativo
    outras_despesas: float = 0.0       # outras despesas operacionais

    # Resultado Financeiro
    despesas_financeiras: float = 0.0  # juros, tarifas bancárias, antecipação
    receitas_financeiras: float = 0.0  # receitas financeiras

    # Impostos sobre lucro
    aliquota_irpj: float = 0.15
    aliquota_csll: float = 0.09
    participacoes: float = 0.0


class DREResult(BaseModel):
    # Receitas
    receita_bruta: float
    deducoes_receita: float
    receita_liquida: float

    # CMV
    cmv: float
    lucro_bruto: float

    # Despesas Operacionais detalhadas
    folha_pagamento: float
    aluguel: float
    energia_agua_gas: float
    marketing: float
    manutencao: float
    despesas_administrativas: float
    outras_despesas: float
    total_despesas_operacionais: float

    # Resultado Operacional
    resultado_operacional: float

    # Resultado Financeiro
    despesas_financeiras: float
    receitas_financeiras: float
    resultado_financeiro: float

    # Impostos e resultado final
    lair: float
    provisao_irpj: float
    provisao_csll: float
    participacoes: float
    lucro_liquido: float

    # Margens
    margem_bruta: Optional[float] = None
    margem_liquida: Optional[float] = None
    margem_operacional: Optional[float] = None

    # Benchmarks (% sobre receita bruta)
    pct_cmv: Optional[float] = None
    pct_folha: Optional[float] = None
    pct_ocupacao: Optional[float] = None
    pct_lucro_liquido: Optional[float] = None
