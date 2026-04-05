from app.models.dre import DREInput, DREResult


def calcular_dre(data: DREInput) -> DREResult:
    # 1. RECEITA BRUTA (soma de todos os canais)
    receita_bruta = (
        data.vendas_dinheiro + data.vendas_pix + data.vendas_debito +
        data.vendas_credito + data.vendas_voucher + data.vendas_ifood
    )

    # 2. DEDUÇÕES DA RECEITA
    impostos_faturamento = data.simples_nacional + data.outras_taxas
    taxas_canais = (
        data.vendas_pix * data.taxa_pix +
        data.vendas_debito * data.taxa_debito +
        data.vendas_credito * data.taxa_credito +
        data.vendas_voucher * data.taxa_voucher +
        data.vendas_ifood * data.taxa_ifood
    )
    total_deducoes = impostos_faturamento + taxas_canais + data.descontos_devolucoes
    receita_liquida = receita_bruta - total_deducoes

    # 3. CMV (Custo da Mercadoria Vendida)
    total_compras = (
        data.insumos_manipulados + data.produtos_prontos + data.bebidas +
        data.padaria_confeitaria + data.descartaveis_embalagens + data.royalties_frete
    )
    cmv = data.estoque_inicial + total_compras - data.estoque_final
    lucro_bruto = receita_liquida - cmv

    # 4. DESPESAS OPERACIONAIS (SG&A)
    total_pessoal = data.salarios_encargos + data.beneficios + data.pro_labore_operacional
    total_fixas = (
        data.aluguel_condominio + data.energia_agua_gas +
        data.sistemas_tecnologia + data.honorarios + data.seguros_taxas_adm
    )
    total_manutencao_adm = (
        data.manutencao + data.material_limpeza_escritorio + data.outras_despesas_adm
    )
    total_marketing = data.fundo_marketing_rede + data.marketing_local
    total_despesas_operacionais = (
        total_pessoal + total_fixas + total_manutencao_adm + total_marketing
    )

    # 5. EBITDA
    ebitda = lucro_bruto - total_despesas_operacionais

    # 6. RESULTADO FINANCEIRO OPERACIONAL
    despesas_financeiras_op = data.juros_emprestimos + data.tarifas_bancarias
    resultado_financeiro = data.receitas_financeiras - despesas_financeiras_op
    pl_operacional = ebitda + resultado_financeiro

    # 7. DESPESAS NÃO OPERACIONAIS
    despesas_nao_operacionais = data.parcela_emprestimo + data.pro_labore_socios
    lair = pl_operacional - despesas_nao_operacionais

    # 8. IMPOSTOS SOBRE LUCRO
    provisao_irpj = max(lair * data.aliquota_irpj, 0)
    provisao_csll = max(lair * data.aliquota_csll, 0)
    lucro_liquido = lair - provisao_irpj - provisao_csll

    # 9. MARGENS (sobre receita líquida)
    margem_bruta = (lucro_bruto / receita_liquida * 100) if receita_liquida != 0 else None
    margem_ebitda = (ebitda / receita_liquida * 100) if receita_liquida != 0 else None
    margem_liquida = (lucro_liquido / receita_liquida * 100) if receita_liquida != 0 else None

    # 10. BENCHMARKS (sobre receita bruta — padrão de mercado gastronomia)
    pct_cmv = (cmv / receita_bruta * 100) if receita_bruta != 0 else None
    pct_pessoal = (total_pessoal / receita_bruta * 100) if receita_bruta != 0 else None
    pct_ocupacao = (data.aluguel_condominio / receita_bruta * 100) if receita_bruta != 0 else None
    pct_lucro_liquido = (lucro_liquido / receita_bruta * 100) if receita_bruta != 0 else None

    return DREResult(
        mes=data.mes,
        ano=data.ano,
        vendas_dinheiro=data.vendas_dinheiro,
        vendas_pix=data.vendas_pix,
        vendas_debito=data.vendas_debito,
        vendas_credito=data.vendas_credito,
        vendas_voucher=data.vendas_voucher,
        vendas_ifood=data.vendas_ifood,
        receita_bruta=receita_bruta,
        impostos_faturamento=impostos_faturamento,
        taxas_canais=taxas_canais,
        descontos_devolucoes=data.descontos_devolucoes,
        total_deducoes=total_deducoes,
        receita_liquida=receita_liquida,
        insumos_manipulados=data.insumos_manipulados,
        produtos_prontos=data.produtos_prontos,
        bebidas=data.bebidas,
        padaria_confeitaria=data.padaria_confeitaria,
        descartaveis_embalagens=data.descartaveis_embalagens,
        royalties_frete=data.royalties_frete,
        total_compras=total_compras,
        estoque_inicial=data.estoque_inicial,
        estoque_final=data.estoque_final,
        cmv=cmv,
        lucro_bruto=lucro_bruto,
        total_pessoal=total_pessoal,
        total_fixas=total_fixas,
        total_manutencao_adm=total_manutencao_adm,
        total_marketing=total_marketing,
        total_despesas_operacionais=total_despesas_operacionais,
        ebitda=ebitda,
        despesas_financeiras_op=despesas_financeiras_op,
        receitas_financeiras=data.receitas_financeiras,
        resultado_financeiro=resultado_financeiro,
        pl_operacional=pl_operacional,
        despesas_nao_operacionais=despesas_nao_operacionais,
        lair=lair,
        provisao_irpj=provisao_irpj,
        provisao_csll=provisao_csll,
        lucro_liquido=lucro_liquido,
        margem_bruta=margem_bruta,
        margem_ebitda=margem_ebitda,
        margem_liquida=margem_liquida,
        pct_cmv=pct_cmv,
        pct_pessoal=pct_pessoal,
        pct_ocupacao=pct_ocupacao,
        pct_lucro_liquido=pct_lucro_liquido,
    )
