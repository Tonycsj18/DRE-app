from pydantic import BaseModel
from typing import Optional


TIPOS_NEGOCIO = {
    "gastronomia": {
        "label": "Restaurante / Bar / Cafeteria / Padaria",
        "bench_custo": (25, 35),
        "bench_pessoal": (25, 30),
        "bench_aluguel": (0, 10),
        "bench_margem": (10, 20),
    },
    "comercio": {
        "label": "Comércio / Loja",
        "bench_custo": (40, 55),
        "bench_pessoal": (10, 20),
        "bench_aluguel": (5, 10),
        "bench_margem": (5, 15),
    },
    "servicos": {
        "label": "Serviços / Consultoria",
        "bench_custo": (10, 25),
        "bench_pessoal": (30, 50),
        "bench_aluguel": (3, 8),
        "bench_margem": (15, 30),
    },
    "ecommerce": {
        "label": "E-commerce",
        "bench_custo": (35, 55),
        "bench_pessoal": (10, 20),
        "bench_aluguel": (1, 5),
        "bench_margem": (5, 15),
    },
}


class DRESimplificadaInput(BaseModel):
    mes: int = 1
    ano: int = 2026
    tipo_negocio: str = "gastronomia"

    # Receita
    receita_total: float = 0.0

    # Deduções diretas
    custo_produtos: float = 0.0       # CMV — o que custou vender
    impostos_taxas: float = 0.0       # Simples, cartões, taxas

    # Despesas — 5 categorias visuais
    despesa_pessoal: float = 0.0      # salários, encargos
    despesa_aluguel: float = 0.0      # aluguel, condomínio, ocupação
    despesa_utilidades: float = 0.0   # energia, água, internet, sistemas
    despesa_marketing: float = 0.0    # marketing, publicidade
    despesa_financeira: float = 0.0   # juros, parcelas de empréstimos
    despesa_outras: float = 0.0       # outras despesas operacionais


class CategoriaGasto(BaseModel):
    nome: str
    valor: float
    pct_receita: float
    cor: str
    status: str      # "ok", "atencao", "critico"
    bench_min: Optional[float] = None
    bench_max: Optional[float] = None


class DRESimplificadaResult(BaseModel):
    mes: int
    ano: int
    tipo_negocio: str
    tipo_negocio_label: str

    # Fluxo financeiro
    receita_total: float
    custo_produtos: float
    impostos_taxas: float
    receita_liquida: float
    lucro_bruto: float

    despesa_pessoal: float
    despesa_aluguel: float
    despesa_utilidades: float
    despesa_marketing: float
    despesa_financeira: float
    despesa_outras: float
    total_despesas: float

    lucro_liquido: float
    margem_lucro: float            # % sobre receita total

    # Visual
    categorias: list[CategoriaGasto]
    maior_gasto_nome: str
    maior_gasto_pct: float

    # Benchmarks
    bench_margem_min: float
    bench_margem_max: float
    margem_status: str             # "ok", "atencao", "critico"

    # Narrativa automática
    narrativa: list[str]           # 3-4 frases em português claro

    # Simulador (base para o frontend calcular)
    economia_10pct_pessoal: float
    economia_10pct_aluguel: float
    economia_10pct_outras: float
