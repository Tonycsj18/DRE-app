export interface DREInput {
  receita_bruta: number;
  devolucoes: number;
  abatimentos: number;
  impostos_vendas: number;
  estoque_inicial: number;
  compras: number;
  estoque_final: number;
  despesas_comerciais: number;
  despesas_administrativas: number;
  despesas_financeiras: number;
  receitas_financeiras: number;
  depreciacao_amortizacao: number;
  resultado_nao_operacional: number;
  aliquota_irpj: number;
  aliquota_csll: number;
  participacoes: number;
}

export interface DREResult {
  receita_bruta: number;
  deducoes_receita: number;
  receita_liquida: number;
  cmv: number;
  lucro_bruto: number;
  despesas_operacionais: number;
  despesas_comerciais: number;
  despesas_administrativas: number;
  despesas_financeiras_liquidas: number;
  ebitda: number;
  depreciacao_amortizacao: number;
  ebit: number;
  resultado_nao_operacional: number;
  lair: number;
  provisao_irpj: number;
  provisao_csll: number;
  participacoes: number;
  lucro_liquido: number;
  margem_bruta: number | null;
  margem_liquida: number | null;
}

export interface DadosExtraidos {
  dados_extraidos: Partial<DREInput>;
}
