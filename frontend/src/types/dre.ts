export interface DREInput {
  mes: number;
  ano: number;

  // Receita por canal
  vendas_dinheiro: number;
  vendas_pix: number;
  vendas_debito: number;
  vendas_credito: number;
  vendas_voucher: number;
  vendas_ifood: number;

  // Impostos sobre faturamento
  simples_nacional: number;
  outras_taxas: number;

  // Taxas por canal (decimal: 0.015 = 1.5%)
  taxa_pix: number;
  taxa_debito: number;
  taxa_credito: number;
  taxa_voucher: number;
  taxa_ifood: number;
  descontos_devolucoes: number;

  // CMV por categoria
  insumos_manipulados: number;
  produtos_prontos: number;
  bebidas: number;
  padaria_confeitaria: number;
  descartaveis_embalagens: number;
  royalties_frete: number;
  estoque_inicial: number;
  estoque_final: number;

  // Pessoal
  salarios_encargos: number;
  beneficios: number;
  pro_labore_operacional: number;

  // Fixas
  aluguel_condominio: number;
  energia_agua_gas: number;
  sistemas_tecnologia: number;
  honorarios: number;
  seguros_taxas_adm: number;

  // Manutenção e Administrativo
  manutencao: number;
  material_limpeza_escritorio: number;
  outras_despesas_adm: number;

  // Marketing
  fundo_marketing_rede: number;
  marketing_local: number;

  // Financeiro
  juros_emprestimos: number;
  tarifas_bancarias: number;
  receitas_financeiras: number;

  // Não Operacional
  parcela_emprestimo: number;
  pro_labore_socios: number;

  // Impostos sobre lucro
  aliquota_irpj: number;
  aliquota_csll: number;
}

export interface DREResult {
  mes: number;
  ano: number;

  vendas_dinheiro: number;
  vendas_pix: number;
  vendas_debito: number;
  vendas_credito: number;
  vendas_voucher: number;
  vendas_ifood: number;
  receita_bruta: number;

  impostos_faturamento: number;
  taxas_canais: number;
  descontos_devolucoes: number;
  total_deducoes: number;
  receita_liquida: number;

  insumos_manipulados: number;
  produtos_prontos: number;
  bebidas: number;
  padaria_confeitaria: number;
  descartaveis_embalagens: number;
  royalties_frete: number;
  total_compras: number;
  estoque_inicial: number;
  estoque_final: number;
  cmv: number;

  lucro_bruto: number;

  total_pessoal: number;
  total_fixas: number;
  total_manutencao_adm: number;
  total_marketing: number;
  total_despesas_operacionais: number;

  ebitda: number;

  despesas_financeiras_op: number;
  receitas_financeiras: number;
  resultado_financeiro: number;

  pl_operacional: number;
  despesas_nao_operacionais: number;
  lair: number;
  provisao_irpj: number;
  provisao_csll: number;
  lucro_liquido: number;

  margem_bruta: number | null;
  margem_ebitda: number | null;
  margem_liquida: number | null;

  pct_cmv: number | null;
  pct_pessoal: number | null;
  pct_ocupacao: number | null;
  pct_lucro_liquido: number | null;
}

export interface DadosExtraidos {
  dados_extraidos: Partial<DREInput>;
}

export interface MesSalvo {
  input: DREInput;
  resultado: DREResult;
  savedAt: string;
}
