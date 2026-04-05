from app.models.dre import DREInput, DREResult


def calcular_dre(data: DREInput) -> DREResult:
    # 1. Deduções da receita
    deducoes = (
        data.impostos_vendas
        + data.taxas_aplicativos
        + data.tarifas_cartoes
        + data.cancelamentos_estornos
    )

    # 2. Receita líquida
    receita_liquida = data.receita_bruta - deducoes

    # 3. CMV (Custo da Mercadoria Vendida)
    cmv = data.estoque_inicial + data.compras - data.estoque_final

    # 4. Lucro bruto
    lucro_bruto = receita_liquida - cmv

    # 5. Despesas operacionais detalhadas
    total_despesas_operacionais = (
        data.folha_pagamento
        + data.aluguel
        + data.energia_agua_gas
        + data.marketing
        + data.manutencao
        + data.despesas_administrativas
        + data.outras_despesas
    )

    # 6. Resultado operacional
    resultado_operacional = lucro_bruto - total_despesas_operacionais

    # 7. Resultado financeiro
    resultado_financeiro = data.receitas_financeiras - data.despesas_financeiras

    # 8. Lucro antes do IR e CSLL
    lair = resultado_operacional + resultado_financeiro

    # 9. Impostos
    provisao_irpj = max(lair * data.aliquota_irpj, 0)
    provisao_csll = max(lair * data.aliquota_csll, 0)

    # 10. Lucro líquido
    lucro_liquido = lair - provisao_irpj - provisao_csll - data.participacoes

    # 11. Margens (sobre receita líquida)
    margem_bruta = (lucro_bruto / receita_liquida * 100) if receita_liquida != 0 else None
    margem_operacional = (resultado_operacional / receita_liquida * 100) if receita_liquida != 0 else None
    margem_liquida = (lucro_liquido / receita_liquida * 100) if receita_liquida != 0 else None

    # 12. Benchmarks (% sobre receita bruta - referência de mercado para gastronomia)
    pct_cmv = (cmv / data.receita_bruta * 100) if data.receita_bruta != 0 else None
    pct_folha = (data.folha_pagamento / data.receita_bruta * 100) if data.receita_bruta != 0 else None
    pct_ocupacao = (data.aluguel / data.receita_bruta * 100) if data.receita_bruta != 0 else None
    pct_lucro_liquido = (lucro_liquido / data.receita_bruta * 100) if data.receita_bruta != 0 else None

    return DREResult(
        receita_bruta=data.receita_bruta,
        deducoes_receita=deducoes,
        receita_liquida=receita_liquida,
        cmv=cmv,
        lucro_bruto=lucro_bruto,
        folha_pagamento=data.folha_pagamento,
        aluguel=data.aluguel,
        energia_agua_gas=data.energia_agua_gas,
        marketing=data.marketing,
        manutencao=data.manutencao,
        despesas_administrativas=data.despesas_administrativas,
        outras_despesas=data.outras_despesas,
        total_despesas_operacionais=total_despesas_operacionais,
        resultado_operacional=resultado_operacional,
        despesas_financeiras=data.despesas_financeiras,
        receitas_financeiras=data.receitas_financeiras,
        resultado_financeiro=resultado_financeiro,
        lair=lair,
        provisao_irpj=provisao_irpj,
        provisao_csll=provisao_csll,
        participacoes=data.participacoes,
        lucro_liquido=lucro_liquido,
        margem_bruta=margem_bruta,
        margem_operacional=margem_operacional,
        margem_liquida=margem_liquida,
        pct_cmv=pct_cmv,
        pct_folha=pct_folha,
        pct_ocupacao=pct_ocupacao,
        pct_lucro_liquido=pct_lucro_liquido,
    )
