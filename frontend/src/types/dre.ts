export interface DREInput {
  // Receita
  receita_bruta: number;

  // Deduções
  impostos_vendas: number;
  taxas_aplicativos: number;
  tarifas_cartoes: number;
  cancelamentos_estornos: number;

  // CMV
  estoque_inicial: number;
  compras: number;
  estoque_final: number;

  // Despesas Operacionais
  folha_pagamento: number;
  aluguel: number;
  energia_agua_gas: number;
  marketing: number;
  manutencao: number;
  despesas_administrativas: number;
  outras_despesas: number;

  // Resultado Financeiro
  despesas_financeiras: number;
  receitas_financeiras: number;

  // Impostos
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
  folha_pagamento: number;
  aluguel: number;
  energia_agua_gas: number;
  marketing: number;
  manutencao: number;
  despesas_administrativas: number;
  outras_despesas: number;
  total_despesas_operacionais: number;
  resultado_operacional: number;
  despesas_financeiras: number;
  receitas_financeiras: number;
  resultado_financeiro: number;
  lair: number;
  provisao_irpj: number;
  provisao_csll: number;
  participacoes: number;
  lucro_liquido: number;
  margem_bruta: number | null;
  margem_operacional: number | null;
  margem_liquida: number | null;
  pct_cmv: number | null;
  pct_folha: number | null;
  pct_ocupacao: number | null;
  pct_lucro_liquido: number | null;
}

export interface DadosExtraidos {
  dados_extraidos: Partial<DREInput>;
}
