from pydantic import BaseModel
from typing import Optional


class DREInput(BaseModel):
    # Período
    mes: int = 1
    ano: int = 2026

    # --- RECEITA POR CANAL DE VENDA ---
    vendas_dinheiro: float = 0.0
    vendas_pix: float = 0.0
    vendas_debito: float = 0.0
    vendas_credito: float = 0.0
    vendas_voucher: float = 0.0        # vale-refeição / voucher
    vendas_ifood: float = 0.0

    # --- IMPOSTOS SOBRE FATURAMENTO ---
    simples_nacional: float = 0.0      # ou ICMS + PIS + COFINS + ISS
    outras_taxas: float = 0.0          # taxas municipais, estaduais, federais

    # --- TAXAS ADMINISTRATIVAS POR CANAL (decimal: 0.015 = 1.5%) ---
    taxa_pix: float = 0.0
    taxa_debito: float = 0.0
    taxa_credito: float = 0.0
    taxa_voucher: float = 0.0
    taxa_ifood: float = 0.0
    descontos_devolucoes: float = 0.0

    # --- CMV POR CATEGORIA ---
    insumos_manipulados: float = 0.0   # DAMM, Maria Frutas, Facilité, Hortifruti, Lab
    produtos_prontos: float = 0.0      # Coffee Shop (Pressca, Flavors, Imeltron, etc.)
    bebidas: float = 0.0               # água, refrigerantes, sucos, grab & go, alcoolicas
    padaria_confeitaria: float = 0.0   # padaria, doces e salgados, frios
    descartaveis_embalagens: float = 0.0
    royalties_frete: float = 0.0       # royalties franquia + fretes e transportes
    estoque_inicial: float = 0.0
    estoque_final: float = 0.0

    # --- DESPESAS DE PESSOAL (RH) ---
    salarios_encargos: float = 0.0     # salários + INSS + FGTS + férias + 13º + rescisões
    beneficios: float = 0.0            # VT + VA + plano saúde + seguro vida + EPIs + uniformes
    pro_labore_operacional: float = 0.0

    # --- DESPESAS FIXAS ---
    aluguel_condominio: float = 0.0    # aluguel + condomínio + fundo de promoção shopping
    energia_agua_gas: float = 0.0
    sistemas_tecnologia: float = 0.0   # TOTVS, GoTotem, F360, Vena, etc.
    honorarios: float = 0.0            # contábeis + advocatícios
    seguros_taxas_adm: float = 0.0     # seguros + taxas adicionais + estacionamento

    # --- MANUTENÇÃO E ADMINISTRATIVO ---
    manutencao: float = 0.0            # predial + mobiliário + equipamentos + TI
    material_limpeza_escritorio: float = 0.0
    outras_despesas_adm: float = 0.0   # dedetizações + cartório + outros

    # --- MARKETING ---
    fundo_marketing_rede: float = 0.0  # fundo de marketing da rede (franquia)
    marketing_local: float = 0.0       # ações iFood + locais + materiais PDV

    # --- DESPESAS FINANCEIRAS OPERACIONAIS ---
    juros_emprestimos: float = 0.0
    tarifas_bancarias: float = 0.0
    receitas_financeiras: float = 0.0  # aplicações / investimentos

    # --- DESPESAS NÃO OPERACIONAIS ---
    parcela_emprestimo: float = 0.0
    pro_labore_socios: float = 0.0

    # --- IMPOSTOS SOBRE LUCRO (0 se já incluso no Simples) ---
    aliquota_irpj: float = 0.0
    aliquota_csll: float = 0.0


class DREResult(BaseModel):
    # Período
    mes: int
    ano: int

    # Receita por canal
    vendas_dinheiro: float
    vendas_pix: float
    vendas_debito: float
    vendas_credito: float
    vendas_voucher: float
    vendas_ifood: float
    receita_bruta: float

    # Deduções
    impostos_faturamento: float
    taxas_canais: float
    descontos_devolucoes: float
    total_deducoes: float
    receita_liquida: float

    # CMV por categoria
    insumos_manipulados: float
    produtos_prontos: float
    bebidas: float
    padaria_confeitaria: float
    descartaveis_embalagens: float
    royalties_frete: float
    total_compras: float
    estoque_inicial: float
    estoque_final: float
    cmv: float

    lucro_bruto: float

    # Despesas operacionais
    total_pessoal: float
    total_fixas: float
    total_manutencao_adm: float
    total_marketing: float
    total_despesas_operacionais: float

    ebitda: float

    # Resultado financeiro
    despesas_financeiras_op: float
    receitas_financeiras: float
    resultado_financeiro: float

    # P&L
    pl_operacional: float
    despesas_nao_operacionais: float
    lair: float
    provisao_irpj: float
    provisao_csll: float
    lucro_liquido: float

    # Margens
    margem_bruta: Optional[float] = None
    margem_ebitda: Optional[float] = None
    margem_liquida: Optional[float] = None

    # Benchmarks (% sobre receita bruta)
    pct_cmv: Optional[float] = None
    pct_pessoal: Optional[float] = None
    pct_ocupacao: Optional[float] = None
    pct_lucro_liquido: Optional[float] = None
