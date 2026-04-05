from app.models.dre import DREInput, DREResult


def calcular_dre(data: DREInput) -> DREResult:
    # 1. Deduções da receita
    deducoes = data.devolucoes + data.abatimentos + data.impostos_vendas

    # 2. Receita líquida
    receita_liquida = data.receita_bruta - deducoes

    # 3. Custo das Mercadorias Vendidas (CMV)
    cmv = data.estoque_inicial + data.compras - data.estoque_final

    # 4. Lucro bruto
    lucro_bruto = receita_liquida - cmv

    # 5. Despesas financeiras líquidas
    despesas_financeiras_liquidas = data.despesas_financeiras - data.receitas_financeiras

    # 6. Total despesas operacionais
    despesas_operacionais = (
        data.despesas_comerciais
        + data.despesas_administrativas
        + despesas_financeiras_liquidas
    )

    # 7. EBITDA (antes de depreciação/amortização)
    ebitda = lucro_bruto - despesas_operacionais

    # 8. EBIT (após depreciação/amortização)
    ebit = ebitda - data.depreciacao_amortizacao

    # 9. Lucro antes do IR e CSLL (LAIR)
    lair = ebit + data.resultado_nao_operacional

    # 10. Impostos
    provisao_irpj = max(lair * data.aliquota_irpj, 0)
    provisao_csll = max(lair * data.aliquota_csll, 0)

    # 11. Lucro líquido
    lucro_liquido = lair - provisao_irpj - provisao_csll - data.participacoes

    # 12. Margens
    margem_bruta = (lucro_bruto / receita_liquida * 100) if receita_liquida != 0 else None
    margem_liquida = (lucro_liquido / receita_liquida * 100) if receita_liquida != 0 else None

    return DREResult(
        receita_bruta=data.receita_bruta,
        deducoes_receita=deducoes,
        receita_liquida=receita_liquida,
        cmv=cmv,
        lucro_bruto=lucro_bruto,
        despesas_operacionais=despesas_operacionais,
        despesas_comerciais=data.despesas_comerciais,
        despesas_administrativas=data.despesas_administrativas,
        despesas_financeiras_liquidas=despesas_financeiras_liquidas,
        ebitda=ebitda,
        depreciacao_amortizacao=data.depreciacao_amortizacao,
        ebit=ebit,
        resultado_nao_operacional=data.resultado_nao_operacional,
        lair=lair,
        provisao_irpj=provisao_irpj,
        provisao_csll=provisao_csll,
        participacoes=data.participacoes,
        lucro_liquido=lucro_liquido,
        margem_bruta=margem_bruta,
        margem_liquida=margem_liquida,
    )
