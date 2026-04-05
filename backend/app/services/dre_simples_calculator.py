from app.models.dre_simples import DRESimplificadaInput, DRESimplificadaResult, CategoriaGasto, TIPOS_NEGOCIO

MESES_NOMES = [
    "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]


def _pct(valor, total):
    return round(valor / total * 100, 1) if total else 0.0


def _status_bench(pct, bench_min, bench_max):
    if pct <= bench_max:
        return "ok"
    elif pct <= bench_max * 1.2:
        return "atencao"
    return "critico"


def _status_margem(margem, bench_min, bench_max):
    if margem >= bench_min:
        return "ok"
    elif margem >= bench_min * 0.5:
        return "atencao"
    return "critico"


def calcular_dre_simples(data: DRESimplificadaInput) -> DRESimplificadaResult:
    bench = TIPOS_NEGOCIO.get(data.tipo_negocio, TIPOS_NEGOCIO["gastronomia"])
    tipo_label = bench["label"]

    # Fluxo financeiro
    receita_liquida = data.receita_total - data.impostos_taxas
    lucro_bruto = receita_liquida - data.custo_produtos
    total_despesas = (
        data.despesa_pessoal + data.despesa_aluguel + data.despesa_utilidades +
        data.despesa_marketing + data.despesa_financeira + data.despesa_outras
    )
    lucro_liquido = lucro_bruto - total_despesas
    margem_lucro = _pct(lucro_liquido, data.receita_total)

    # Categorias visuais com benchmarks
    categorias_raw = [
        ("Custo dos Produtos", data.custo_produtos, "#ef4444",
         bench["bench_custo"][0], bench["bench_custo"][1]),
        ("Pessoal", data.despesa_pessoal, "#f97316",
         bench["bench_pessoal"][0], bench["bench_pessoal"][1]),
        ("Aluguel e Ocupação", data.despesa_aluguel, "#eab308",
         bench["bench_aluguel"][0], bench["bench_aluguel"][1]),
        ("Utilidades", data.despesa_utilidades, "#8b5cf6", None, None),
        ("Marketing", data.despesa_marketing, "#06b6d4", None, None),
        ("Financeiro", data.despesa_financeira, "#64748b", None, None),
        ("Outras Despesas", data.despesa_outras, "#94a3b8", None, None),
    ]

    categorias = []
    for nome, valor, cor, bmin, bmax in categorias_raw:
        pct = _pct(valor, data.receita_total)
        if bmin is not None and bmax is not None:
            status = _status_bench(pct, bmin, bmax)
        else:
            status = "ok"
        categorias.append(CategoriaGasto(
            nome=nome, valor=valor, pct_receita=pct,
            cor=cor, status=status, bench_min=bmin, bench_max=bmax,
        ))

    # Maior gasto
    gastos = [(c.nome, c.valor) for c in categorias if c.valor > 0]
    if gastos:
        maior_nome, maior_val = max(gastos, key=lambda x: x[1])
        maior_pct = _pct(maior_val, data.receita_total)
    else:
        maior_nome, maior_pct = "—", 0.0

    # Status da margem
    bench_mmin, bench_mmax = bench["bench_margem"]
    margem_status = _status_margem(margem_lucro, bench_mmin, bench_mmax)

    # Narrativa automática
    narrativa = _gerar_narrativa(
        data, lucro_liquido, margem_lucro, total_despesas,
        maior_nome, maior_pct, margem_status, bench_mmin, bench_mmax,
    )

    # Simulador
    economia_10pct_pessoal = lucro_liquido + data.despesa_pessoal * 0.10
    economia_10pct_aluguel = lucro_liquido + data.despesa_aluguel * 0.10
    economia_10pct_outras = lucro_liquido + data.despesa_outras * 0.10

    return DRESimplificadaResult(
        mes=data.mes,
        ano=data.ano,
        tipo_negocio=data.tipo_negocio,
        tipo_negocio_label=tipo_label,
        receita_total=data.receita_total,
        custo_produtos=data.custo_produtos,
        impostos_taxas=data.impostos_taxas,
        receita_liquida=receita_liquida,
        lucro_bruto=lucro_bruto,
        despesa_pessoal=data.despesa_pessoal,
        despesa_aluguel=data.despesa_aluguel,
        despesa_utilidades=data.despesa_utilidades,
        despesa_marketing=data.despesa_marketing,
        despesa_financeira=data.despesa_financeira,
        despesa_outras=data.despesa_outras,
        total_despesas=total_despesas,
        lucro_liquido=lucro_liquido,
        margem_lucro=margem_lucro,
        categorias=categorias,
        maior_gasto_nome=maior_nome,
        maior_gasto_pct=maior_pct,
        bench_margem_min=bench_mmin,
        bench_margem_max=bench_mmax,
        margem_status=margem_status,
        narrativa=narrativa,
        economia_10pct_pessoal=economia_10pct_pessoal,
        economia_10pct_aluguel=economia_10pct_aluguel,
        economia_10pct_outras=economia_10pct_outras,
    )


def _gerar_narrativa(data, lucro, margem, total_desp, maior_nome, maior_pct,
                     margem_status, bench_min, bench_max):
    mes = MESES_NOMES[data.mes]
    frases = []

    # Frase 1 — resultado geral
    if lucro > 0:
        frases.append(
            f"Em {mes}, seu negócio teve lucro líquido de {_brl(lucro)} "
            f"— uma margem de {margem:.1f}% sobre o faturamento."
        )
    else:
        frases.append(
            f"Em {mes}, o negócio terminou no prejuízo: {_brl(abs(lucro))} "
            f"a mais de saída do que de entrada."
        )

    # Frase 2 — margem vs benchmark
    if margem_status == "ok":
        frases.append(
            f"Sua margem de {margem:.1f}% está dentro do esperado para o setor "
            f"(referência: {bench_min}% a {bench_max}%). Continue assim."
        )
    elif margem_status == "atencao":
        frases.append(
            f"Sua margem de {margem:.1f}% está abaixo do ideal para o setor "
            f"(referência: {bench_min}% a {bench_max}%). Vale revisar seus custos."
        )
    else:
        frases.append(
            f"Atenção: margem de {margem:.1f}% está bem abaixo do esperado "
            f"(referência: {bench_min}% a {bench_max}%). Ação imediata recomendada."
        )

    # Frase 3 — maior gasto
    if maior_nome and maior_pct > 0:
        frases.append(
            f"O item que mais pesou no mês foi '{maior_nome}', "
            f"representando {maior_pct:.1f}% do faturamento."
        )

    # Frase 4 — dica de simulação
    if data.despesa_pessoal > 0 and data.despesa_pessoal == max(
        data.despesa_pessoal, data.despesa_aluguel, data.despesa_outras
    ):
        eco = data.despesa_pessoal * 0.10
        frases.append(
            f"Reduzir 10% em Pessoal acrescentaria {_brl(eco)} direto no seu lucro — "
            f"use o simulador abaixo para explorar outros cenários."
        )
    elif data.despesa_outras > 0:
        eco = data.despesa_outras * 0.10
        frases.append(
            f"Reduzir 10% em Outras Despesas acrescentaria {_brl(eco)} no seu lucro. "
            f"Experimente o simulador abaixo."
        )
    else:
        frases.append(
            "Use o simulador abaixo para testar o impacto de cortes em cada categoria."
        )

    return frases


def _brl(v):
    return f"R$ {v:_.2f}".replace("_", ".").replace(",", "X").replace(".", ",").replace("X", ".")
