"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DREInput, DadosExtraidos } from "@/types/dre";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const ANO_ATUAL = new Date().getFullYear();
const MES_ATUAL = new Date().getMonth() + 1;

const VALORES_PADRAO: DREInput = {
  mes: MES_ATUAL,
  ano: ANO_ATUAL,
  vendas_dinheiro: 0, vendas_pix: 0, vendas_debito: 0,
  vendas_credito: 0, vendas_voucher: 0, vendas_ifood: 0,
  simples_nacional: 0, outras_taxas: 0,
  taxa_pix: 0.01, taxa_debito: 0.015, taxa_credito: 0.03,
  taxa_voucher: 0.08, taxa_ifood: 0.15,
  descontos_devolucoes: 0,
  insumos_manipulados: 0, produtos_prontos: 0, bebidas: 0,
  padaria_confeitaria: 0, descartaveis_embalagens: 0,
  royalties_frete: 0, estoque_inicial: 0, estoque_final: 0,
  salarios_encargos: 0, beneficios: 0, pro_labore_operacional: 0,
  aluguel_condominio: 0, energia_agua_gas: 0, sistemas_tecnologia: 0,
  honorarios: 0, seguros_taxas_adm: 0,
  manutencao: 0, material_limpeza_escritorio: 0, outras_despesas_adm: 0,
  fundo_marketing_rede: 0, marketing_local: 0,
  juros_emprestimos: 0, tarifas_bancarias: 0, receitas_financeiras: 0,
  parcela_emprestimo: 0, pro_labore_socios: 0,
  aliquota_irpj: 0, aliquota_csll: 0,
};

function Campo({
  label, valor, onChange, isPercent = false, dica,
}: {
  label: string;
  valor: number;
  onChange: (v: number) => void;
  isPercent?: boolean;
  dica?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {dica && <p className="text-xs text-gray-400 mb-1">{dica}</p>}
      <div className="relative">
        {!isPercent && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
        )}
        <input
          type="number"
          step={isPercent ? "0.001" : "0.01"}
          min="0"
          value={valor}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`w-full border border-gray-300 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isPercent ? "px-3" : "pl-8 pr-3"}`}
        />
        {isPercent && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            = {(valor * 100).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function Secao({ titulo, descricao, children }: { titulo: string; descricao: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <p className="font-semibold text-gray-800 text-sm">{titulo}</p>
        <p className="text-xs text-gray-500 mt-0.5">{descricao}</p>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

const CATEGORIAS_CMV = [
  { key: "insumos_manipulados", label: "Insumos Manipulados" },
  { key: "produtos_prontos", label: "Produtos Prontos" },
  { key: "bebidas", label: "Bebidas" },
  { key: "padaria_confeitaria", label: "Padaria e Confeitaria" },
  { key: "descartaveis_embalagens", label: "Descartáveis e Embalagens" },
] as const;

const CANAIS_VENDA = [
  { key: "vendas_pix", label: "Vendas PIX" },
  { key: "vendas_dinheiro", label: "Vendas Dinheiro" },
  { key: "vendas_debito", label: "Vendas Débito" },
  { key: "vendas_credito", label: "Vendas Crédito" },
  { key: "vendas_voucher", label: "Vendas Voucher" },
  { key: "vendas_ifood", label: "Vendas iFood/Delivery" },
] as const;

const CATEGORIAS_IMPOSTO = [
  { key: "simples_nacional", label: "Simples Nacional (DAS)" },
  { key: "outras_taxas",     label: "ICMS / ISS / Outras Guias" },
] as const;

const CATEGORIAS_RH = [
  { key: "salarios_encargos",      label: "Salários, FGTS e INSS (Folha)" },
  { key: "beneficios",             label: "Benefícios (VT, VA, Plano de Saúde)" },
  { key: "pro_labore_operacional", label: "Pró-labore Operacional" },
] as const;

export default function Home() {
  const router = useRouter();
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [arrastando, setArrastando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState<DREInput>(VALORES_PADRAO);
  const [modoManual, setModoManual] = useState(false);
  const [tipoUpload, setTipoUpload] = useState<"compras" | "vendas" | "impostos" | "rh">("compras");
  const [categoriaCompra, setCategoriaCompra] = useState<typeof CATEGORIAS_CMV[number]["key"]>("produtos_prontos");
  const [canalVenda, setCanalVenda] = useState<typeof CANAIS_VENDA[number]["key"]>("vendas_pix");
  const [categoriaImposto, setCategoriaImposto] = useState<typeof CATEGORIAS_IMPOSTO[number]["key"]>("simples_nacional");
  const [categoriaRH, setCategoriaRH] = useState<typeof CATEGORIAS_RH[number]["key"]>("salarios_encargos");

  const set = (key: keyof DREInput) => (v: number) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const receitaBruta =
    form.vendas_dinheiro + form.vendas_pix + form.vendas_debito +
    form.vendas_credito + form.vendas_voucher + form.vendas_ifood;

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    const novos = Array.from(e.dataTransfer.files).filter((f) =>
      ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/xml", "application/xml"].includes(f.type)
      || f.name.toLowerCase().endsWith(".xml")
    );
    setArquivos((prev) => [...prev, ...novos]);
  }, []);

  const handleUpload = async () => {
    if (arquivos.length === 0) return;
    setCarregando(true);
    setErro(null);
    try {
      const formData = new FormData();
      arquivos.forEach((f) => formData.append("arquivos", f));
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API}/dre/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data: DadosExtraidos = await res.json();
      const ext = data.dados_extraidos as Record<string, number>;

      // Valor total extraído dos documentos (independente do tpNF do XML)
      // tpNF=1 no XML significa saída do FORNECEDOR → para nós é compra
      const valorTotal = (ext.receita_bruta ?? 0) + (ext.compras ?? 0);

      if (tipoUpload === "compras") {
        // Documentos de compra → categoria CMV selecionada
        setForm((prev) => ({
          ...prev,
          [categoriaCompra]: prev[categoriaCompra] + valorTotal,
          royalties_frete: prev.royalties_frete + (ext.royalties_frete ?? 0),
          estoque_inicial: prev.estoque_inicial + (ext.estoque_inicial ?? 0),
          estoque_final: prev.estoque_final + (ext.estoque_final ?? 0),
        }));
      } else if (tipoUpload === "vendas") {
        // Documentos de venda → canal de venda selecionado + impostos
        setForm((prev) => ({
          ...prev,
          [canalVenda]: prev[canalVenda] + valorTotal,
          simples_nacional: prev.simples_nacional + (ext.impostos_vendas ?? 0),
          descontos_devolucoes: prev.descontos_devolucoes + (ext.devolucoes ?? 0),
          receitas_financeiras: prev.receitas_financeiras + (ext.receitas_financeiras ?? 0),
        }));
      } else if (tipoUpload === "impostos") {
        // Guias de imposto (DAS, ICMS, ISS, etc.) → campo de imposto selecionado
        setForm((prev) => ({
          ...prev,
          [categoriaImposto]: (prev[categoriaImposto] as number) + valorTotal,
        }));
      } else if (tipoUpload === "rh") {
        // Documentos de RH (folha, FGTS, INSS, benefícios) → campo RH selecionado
        setForm((prev) => ({
          ...prev,
          [categoriaRH]: (prev[categoriaRH] as number) + valorTotal,
        }));
      }
      // Limpa a lista após processar para evitar reprocessamento ao adicionar mais documentos
      setArquivos([]);
      setModoManual(true);
    } catch {
      setErro("Não foi possível processar os documentos.");
    } finally {
      setCarregando(false);
    }
  };

  const handleCalcular = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API}/dre/calcular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const resultado = await res.json();
      sessionStorage.setItem("dreResultado", JSON.stringify(resultado));
      sessionStorage.setItem("dreInput", JSON.stringify(form));
      router.push("/completa/resultado");
    } catch {
      setErro("Não foi possível calcular a DRE.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Demonstração do Resultado do Exercício</h1>
        <p className="text-gray-500 mt-1">Envie os documentos da empresa ou preencha os valores manualmente.</p>
      </div>

      {!modoManual ? (
        <div className="space-y-6">
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
            onDragLeave={() => setArrastando(false)}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${arrastando ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:border-blue-400"}`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Arraste seus documentos aqui</p>
                <p className="text-gray-400 text-sm mt-1">PDF, Excel (.xlsx, .xls) — relatórios, notas fiscais, balanços</p>
              </div>
              <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                Selecionar arquivos
                <input type="file" multiple accept=".pdf,.xlsx,.xls,.xml" className="hidden" onChange={(e) => { if (e.target.files) setArquivos((p) => [...p, ...Array.from(e.target.files!)]); }} />
              </label>
            </div>
          </div>

          {arquivos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {arquivos.map((f, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                      <span className="text-red-600 text-xs font-bold uppercase">{f.name.split(".").pop()}</span>
                    </div>
                    <span className="text-sm text-gray-700">{f.name}</span>
                  </div>
                  <button onClick={() => setArquivos((p) => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 text-sm">Remover</button>
                </div>
              ))}
            </div>
          )}

          {/* Seletor de tipo de documento */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <p className="text-sm font-semibold text-gray-700">Estes documentos são:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTipoUpload("compras")}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${tipoUpload === "compras" ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
              >
                🛒 Compras / Fornecedores
              </button>
              <button
                onClick={() => setTipoUpload("vendas")}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${tipoUpload === "vendas" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
              >
                💰 Vendas / Receitas
              </button>
              <button
                onClick={() => setTipoUpload("impostos")}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${tipoUpload === "impostos" ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
              >
                🧾 Impostos / Guias
              </button>
              <button
                onClick={() => setTipoUpload("rh")}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${tipoUpload === "rh" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
              >
                👥 RH / Pessoal
              </button>
            </div>

            {tipoUpload === "compras" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categoria CMV (onde lançar as compras)</label>
                <select
                  value={categoriaCompra}
                  onChange={(e) => setCategoriaCompra(e.target.value as typeof categoriaCompra)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {CATEGORIAS_CMV.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
            )}

            {tipoUpload === "vendas" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Canal de venda</label>
                <select
                  value={canalVenda}
                  onChange={(e) => setCanalVenda(e.target.value as typeof canalVenda)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {CANAIS_VENDA.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
            )}

            {tipoUpload === "impostos" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de guia / imposto</label>
                <select
                  value={categoriaImposto}
                  onChange={(e) => setCategoriaImposto(e.target.value as typeof categoriaImposto)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {CATEGORIAS_IMPOSTO.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Ex: DAS do Simples Nacional, DARF de ICMS, guia de ISS</p>
              </div>
            )}

            {tipoUpload === "rh" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categoria de RH</label>
                <select
                  value={categoriaRH}
                  onChange={(e) => setCategoriaRH(e.target.value as typeof categoriaRH)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIAS_RH.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Ex: folha de pagamento, guia de FGTS, DARF do INSS, recibo de benefícios</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={handleUpload} disabled={arquivos.length === 0 || carregando} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
              {carregando ? "Processando..." : "Processar documentos"}
            </button>
            <button onClick={() => setModoManual(true)} className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition-colors">
              Preencher manualmente
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Preencha os dados do período</h2>
            <button onClick={() => setModoManual(false)} className="text-sm text-blue-600 hover:underline">← Voltar ao upload</button>
          </div>

          {/* PERÍODO */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
              <p className="font-semibold text-blue-800 text-sm">Período de Referência</p>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mês</label>
                <select
                  value={form.mes}
                  onChange={(e) => setForm((p) => ({ ...p, mes: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ano</label>
                <input
                  type="number"
                  value={form.ano}
                  onChange={(e) => setForm((p) => ({ ...p, ano: parseInt(e.target.value) || ANO_ATUAL }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* RECEITA POR CANAL */}
          <Secao titulo="Receita por Canal de Venda" descricao="Informe o faturamento separado por forma de recebimento">
            <Campo label="Vendas em Dinheiro" valor={form.vendas_dinheiro} onChange={set("vendas_dinheiro")} />
            <Campo label="Vendas em PIX" valor={form.vendas_pix} onChange={set("vendas_pix")} />
            <Campo label="Vendas Cartão Débito" valor={form.vendas_debito} onChange={set("vendas_debito")} />
            <Campo label="Vendas Cartão Crédito" valor={form.vendas_credito} onChange={set("vendas_credito")} />
            <Campo label="Vendas Voucher / Vale-Refeição" valor={form.vendas_voucher} onChange={set("vendas_voucher")} />
            <Campo label="Vendas iFood / Delivery" valor={form.vendas_ifood} onChange={set("vendas_ifood")} />
            {receitaBruta > 0 && (
              <div className="md:col-span-2 bg-blue-50 rounded-lg px-4 py-2 text-sm text-blue-800 font-medium">
                Receita Bruta Total: {receitaBruta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
            )}
          </Secao>

          {/* IMPOSTOS E TAXAS */}
          <Secao titulo="Impostos e Taxas sobre Vendas" descricao="Deduções que não pertencem efetivamente à empresa">
            <Campo label="Simples Nacional (ou ICMS + PIS + COFINS + ISS)" valor={form.simples_nacional} onChange={set("simples_nacional")} />
            <Campo label="Outras Taxas Municipais / Estaduais / Federais" valor={form.outras_taxas} onChange={set("outras_taxas")} />
            <Campo label="Descontos e Devoluções" valor={form.descontos_devolucoes} onChange={set("descontos_devolucoes")} />
            <div className="md:col-span-2 border-t border-gray-100 pt-3 mt-1">
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Taxas administrativas por canal (ex: 0.015 = 1.5%)</p>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Taxa PIX" valor={form.taxa_pix} onChange={set("taxa_pix")} isPercent dica="" />
                <Campo label="Taxa Cartão Débito" valor={form.taxa_debito} onChange={set("taxa_debito")} isPercent />
                <Campo label="Taxa Cartão Crédito" valor={form.taxa_credito} onChange={set("taxa_credito")} isPercent />
                <Campo label="Taxa Voucher / Vale-Refeição" valor={form.taxa_voucher} onChange={set("taxa_voucher")} isPercent />
                <Campo label="Taxa iFood / Delivery" valor={form.taxa_ifood} onChange={set("taxa_ifood")} isPercent />
              </div>
            </div>
          </Secao>

          {/* CMV */}
          <Secao titulo="CMV — Compras por Categoria" descricao="Custo dos produtos vendidos. O CMV = Estoque Inicial + Compras − Estoque Final">
            <Campo label="Insumos Manipulados" valor={form.insumos_manipulados} onChange={set("insumos_manipulados")} dica="Alimentos, frutas, legumes, laticínios, frios, hortifruti" />
            <Campo label="Produtos Prontos" valor={form.produtos_prontos} onChange={set("produtos_prontos")} dica="Itens que chegam prontos (coffee shop, Lab, etc.)" />
            <Campo label="Bebidas" valor={form.bebidas} onChange={set("bebidas")} dica="Água, refrigerantes, sucos, grab & go, alcoólicas" />
            <Campo label="Padaria e Confeitaria" valor={form.padaria_confeitaria} onChange={set("padaria_confeitaria")} dica="Pães, doces, salgados, bolos" />
            <Campo label="Descartáveis e Embalagens" valor={form.descartaveis_embalagens} onChange={set("descartaveis_embalagens")} />
            <Campo label="Royalties e Fretes" valor={form.royalties_frete} onChange={set("royalties_frete")} dica="Royalties da franquia + fretes e transporte" />
            <Campo label="Estoque Inicial do Período" valor={form.estoque_inicial} onChange={set("estoque_inicial")} />
            <Campo label="Estoque Final do Período" valor={form.estoque_final} onChange={set("estoque_final")} />
          </Secao>

          {/* PESSOAL */}
          <Secao titulo="Despesas de Pessoal (RH)" descricao="Todos os custos relacionados à equipe">
            <Campo label="Salários e Encargos" valor={form.salarios_encargos} onChange={set("salarios_encargos")} dica="Salários + INSS + FGTS + férias + 13º + rescisões" />
            <Campo label="Benefícios" valor={form.beneficios} onChange={set("beneficios")} dica="VT + VA + plano de saúde + seguro vida + EPIs + uniformes" />
            <Campo label="Pró-labore Operacional" valor={form.pro_labore_operacional} onChange={set("pro_labore_operacional")} />
          </Secao>

          {/* FIXAS */}
          <Secao titulo="Despesas Fixas" descricao="Custos fixos mensais de ocupação e funcionamento">
            <Campo label="Aluguel e Condomínio" valor={form.aluguel_condominio} onChange={set("aluguel_condominio")} dica="Aluguel + condomínio + fundo promoção shopping" />
            <Campo label="Energia, Água e Gás" valor={form.energia_agua_gas} onChange={set("energia_agua_gas")} />
            <Campo label="Sistemas e Tecnologia" valor={form.sistemas_tecnologia} onChange={set("sistemas_tecnologia")} dica="TOTVS, GoTotem, F360, Vena, internet, etc." />
            <Campo label="Honorários" valor={form.honorarios} onChange={set("honorarios")} dica="Contábeis + advocatícios" />
            <Campo label="Seguros e Taxas Administrativas" valor={form.seguros_taxas_adm} onChange={set("seguros_taxas_adm")} dica="Seguros + taxas adicionais + estacionamento" />
          </Secao>

          {/* MANUTENÇÃO */}
          <Secao titulo="Manutenção e Administrativo" descricao="Gastos variáveis com operação e infraestrutura">
            <Campo label="Manutenção" valor={form.manutencao} onChange={set("manutencao")} dica="Predial + mobiliário + equipamentos + informática" />
            <Campo label="Material de Limpeza e Escritório" valor={form.material_limpeza_escritorio} onChange={set("material_limpeza_escritorio")} dica="Limpeza + papelaria + dedetizações + certificado digital" />
            <Campo label="Outras Despesas Administrativas" valor={form.outras_despesas_adm} onChange={set("outras_despesas_adm")} />
          </Secao>

          {/* MARKETING */}
          <Secao titulo="Marketing" descricao="Investimentos em divulgação e promoção">
            <Campo label="Fundo de Marketing da Rede" valor={form.fundo_marketing_rede} onChange={set("fundo_marketing_rede")} dica="Fundo da franquia (ex: Café Cultura Franchising)" />
            <Campo label="Marketing Local" valor={form.marketing_local} onChange={set("marketing_local")} dica="Ações iFood + ações locais + materiais de PDV" />
          </Secao>

          {/* FINANCEIRO */}
          <Secao titulo="Resultado Financeiro" descricao="Despesas e receitas financeiras operacionais">
            <Campo label="Juros sobre Empréstimos" valor={form.juros_emprestimos} onChange={set("juros_emprestimos")} />
            <Campo label="Tarifas Bancárias" valor={form.tarifas_bancarias} onChange={set("tarifas_bancarias")} />
            <Campo label="Receitas Financeiras" valor={form.receitas_financeiras} onChange={set("receitas_financeiras")} dica="Juros recebidos de aplicações/investimentos" />
          </Secao>

          {/* NÃO OPERACIONAL */}
          <Secao titulo="Despesas Não Operacionais" descricao="Itens que não fazem parte da operação principal">
            <Campo label="Parcela de Empréstimo" valor={form.parcela_emprestimo} onChange={set("parcela_emprestimo")} />
            <Campo label="Pró-labore dos Sócios" valor={form.pro_labore_socios} onChange={set("pro_labore_socios")} />
          </Secao>

          {/* IMPOSTOS SOBRE LUCRO */}
          <Secao titulo="Impostos sobre Lucro" descricao="Deixe em 0 se já incluídos no Simples Nacional">
            <Campo label="Alíquota IRPJ (ex: 0.15 = 15%)" valor={form.aliquota_irpj} onChange={set("aliquota_irpj")} isPercent />
            <Campo label="Alíquota CSLL (ex: 0.09 = 9%)" valor={form.aliquota_csll} onChange={set("aliquota_csll")} isPercent />
          </Secao>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{erro}</div>
          )}

          <button
            onClick={handleCalcular}
            disabled={carregando}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-10 py-3 rounded-lg font-semibold transition-colors text-base"
          >
            {carregando ? "Calculando..." : `Gerar DRE — ${MESES[form.mes - 1]} ${form.ano}`}
          </button>
        </div>
      )}

      {!modoManual && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{erro}</div>
      )}
    </div>
  );
}
