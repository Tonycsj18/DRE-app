"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DREResult, DREInput } from "@/types/dre";
import { apiJson } from "@/lib/api";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PCT = (v: number | null | undefined) =>
  v != null ? `${v.toFixed(1)}%` : "—";

function Linha({
  label, valor, negrito = false, negativo = false, separador = false, indent = false, destaque = false,
}: {
  label: string; valor: number | null; negrito?: boolean; negativo?: boolean;
  separador?: boolean; indent?: boolean; destaque?: boolean;
}) {
  const cor = valor !== null && valor < 0 ? "text-red-600"
    : valor !== null && valor > 0 && destaque ? "text-green-700" : "text-gray-800";
  return (
    <>
      {separador && <tr><td colSpan={2} className="py-1"><div className="border-t border-gray-200" /></td></tr>}
      <tr className={destaque ? "bg-gray-50" : ""}>
        <td className={`py-2 pr-2 text-sm ${indent ? "pl-10" : "pl-4"} ${negrito ? "font-semibold" : ""} text-gray-700`}>
          {negativo ? `(−) ${label}` : label}
        </td>
        <td className={`py-2 pr-4 text-sm text-right ${cor} ${negrito ? "font-semibold" : ""}`}>
          {valor !== null ? BRL(valor) : "—"}
        </td>
      </tr>
    </>
  );
}

function Benchmark({ label, valor, referencia, descricao, dentro }: {
  label: string; valor: number | null | undefined; referencia: string; descricao: string; dentro: boolean | null;
}) {
  const cor = dentro === null ? "gray" : dentro ? "green" : "yellow";
  const cores = {
    gray: { bg: "bg-gray-50", border: "border-gray-200", badge: "bg-gray-100 text-gray-600", txt: "text-gray-400" },
    green: { bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-700", txt: "text-green-600" },
    yellow: { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-700", txt: "text-yellow-600" },
  }[cor];
  return (
    <div className={`rounded-xl border p-4 ${cores.bg} ${cores.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{PCT(valor)}</p>
          <p className="text-xs text-gray-500 mt-1">{descricao}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${cores.badge}`}>Ref: {referencia}</span>
      </div>
      {dentro !== null && (
        <p className={`text-xs mt-2 font-medium ${cores.txt}`}>
          {dentro ? "Dentro do parâmetro" : "Fora do parâmetro"}
        </p>
      )}
    </div>
  );
}

export default function ResultadoPage() {
  const router = useRouter();
  const [dre, setDre] = useState<DREResult | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  useEffect(() => {
    const dados = sessionStorage.getItem("dreResultado");
    if (!dados) { router.push("/"); return; }
    setDre(JSON.parse(dados));
  }, [router]);

  const handleSalvar = async () => {
    if (!dre) return;
    setSalvando(true);
    setErroSalvar(null);
    try {
      const inputRaw = sessionStorage.getItem("dreInput");
      const input: DREInput | null = inputRaw ? JSON.parse(inputRaw) : null;
      await apiJson("/dre/salvar", {
        method: "POST",
        body: JSON.stringify({ input, resultado: dre }),
      });
      setSalvo(true);
    } catch (e: unknown) {
      setErroSalvar(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  if (!dre) return null;

  const nomeMes = MESES[dre.mes - 1];
  const isLucro = dre.lucro_liquido >= 0;

  const benchmarks: Array<{ label: string; valor: number | null | undefined; ref: string; desc: string; fn: (v: number) => boolean }> = [
    { label: "CMV", valor: dre.pct_cmv, ref: "25% – 35%", desc: "Custo da mercadoria / receita bruta", fn: (v) => v >= 25 && v <= 35 },
    { label: "Pessoal (RH)", valor: dre.pct_pessoal, ref: "25% – 30%", desc: "Salários e encargos / receita bruta", fn: (v) => v >= 25 && v <= 30 },
    { label: "Ocupação", valor: dre.pct_ocupacao, ref: "até 10%", desc: "Aluguel e condomínio / receita bruta", fn: (v) => v <= 10 },
    { label: "Lucro Líquido", valor: dre.pct_lucro_liquido, ref: "10% – 20%", desc: "Lucro líquido / receita bruta", fn: (v) => v >= 10 && v <= 20 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resultado da DRE</h1>
          <p className="text-gray-500 mt-1">{nomeMes} {dre.ano} — gerado automaticamente</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {erroSalvar && <span className="text-xs text-red-600 self-center">{erroSalvar}</span>}
          <button
            onClick={handleSalvar}
            disabled={salvando || salvo}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              salvo ? "bg-green-100 text-green-700 border border-green-200 cursor-default"
              : "bg-green-600 hover:bg-green-700 text-white disabled:bg-green-400"
            }`}
          >
            {salvando ? "Salvando..." : salvo ? "Salvo no Dashboard" : "Salvar no Dashboard"}
          </button>
          <button onClick={() => router.push("/completa")} className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Nova DRE
          </button>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Receita Bruta</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{BRL(dre.receita_bruta)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Receita Líquida</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{BRL(dre.receita_liquida)}</p>
          <p className="text-xs text-gray-400 mt-1">Margem bruta: {PCT(dre.margem_bruta)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">EBITDA</p>
          <p className={`text-2xl font-bold mt-1 ${dre.ebitda >= 0 ? "text-blue-700" : "text-red-700"}`}>{BRL(dre.ebitda)}</p>
          <p className="text-xs text-gray-400 mt-1">Margem: {PCT(dre.margem_ebitda)}</p>
        </div>
        <div className={`rounded-xl border p-5 ${isLucro ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <p className={`text-xs font-medium uppercase tracking-wide ${isLucro ? "text-green-600" : "text-red-600"}`}>{isLucro ? "Lucro Líquido" : "Prejuízo"}</p>
          <p className={`text-2xl font-bold mt-1 ${isLucro ? "text-green-700" : "text-red-700"}`}>{BRL(dre.lucro_liquido)}</p>
          <p className="text-xs text-gray-400 mt-1">Margem: {PCT(dre.margem_liquida)}</p>
        </div>
      </div>

      {/* Canais */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-800 text-sm">Receita por Canal de Venda</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-gray-100">
          {[
            { label: "Dinheiro", val: dre.vendas_dinheiro },
            { label: "PIX", val: dre.vendas_pix },
            { label: "Débito", val: dre.vendas_debito },
            { label: "Crédito", val: dre.vendas_credito },
            { label: "Voucher/VR", val: dre.vendas_voucher },
            { label: "iFood/Delivery", val: dre.vendas_ifood },
          ].map(({ label, val }) => (
            <div key={label} className="px-4 py-3">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-semibold text-gray-800 text-sm mt-0.5">{BRL(val)}</p>
              {dre.receita_bruta > 0 && <p className="text-xs text-gray-400">{((val / dre.receita_bruta) * 100).toFixed(1)}%</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Benchmarks */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-800 text-sm">Indicadores de Referência — Gastronomia</h2>
          <p className="text-xs text-gray-500 mt-0.5">Parâmetros de mercado para restaurantes, bares, cafeterias e padarias</p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {benchmarks.map(({ label, valor, ref, desc, fn }) => (
            <Benchmark key={label} label={label} valor={valor} referencia={ref} descricao={desc} dentro={valor != null ? fn(valor) : null} />
          ))}
        </div>
      </div>

      {/* DRE Completa */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-800 text-sm">DRE Detalhada — {nomeMes} {dre.ano}</h2>
        </div>
        <table className="w-full">
          <tbody>
            <Linha label="Receita Operacional Bruta" valor={dre.receita_bruta} negrito />
            <Linha label="Impostos sobre Faturamento" valor={-dre.impostos_faturamento} negativo indent />
            <Linha label="Taxas Administrativas dos Canais" valor={-dre.taxas_canais} negativo indent />
            <Linha label="Descontos e Devoluções" valor={-dre.descontos_devolucoes} negativo indent />
            <Linha label="Receita Operacional Líquida (ROL)" valor={dre.receita_liquida} negrito destaque separador />

            <Linha label="Insumos Manipulados" valor={-dre.insumos_manipulados} negativo indent />
            <Linha label="Produtos Prontos" valor={-dre.produtos_prontos} negativo indent />
            <Linha label="Bebidas" valor={-dre.bebidas} negativo indent />
            <Linha label="Padaria e Confeitaria" valor={-dre.padaria_confeitaria} negativo indent />
            <Linha label="Descartáveis e Embalagens" valor={-dre.descartaveis_embalagens} negativo indent />
            <Linha label="Royalties e Fretes" valor={-dre.royalties_frete} negativo indent />
            <Linha label="(+) Estoque Inicial" valor={dre.estoque_inicial} indent />
            <Linha label="(−) Estoque Final" valor={-dre.estoque_final} negativo indent />
            <Linha label="CMV da Operação" valor={-dre.cmv} negativo negrito separador />
            <Linha label="Lucro Bruto" valor={dre.lucro_bruto} negrito destaque separador />

            <Linha label="Despesas de Pessoal (RH)" valor={-dre.total_pessoal} negativo indent />
            <Linha label="Despesas Fixas" valor={-dre.total_fixas} negativo indent />
            <Linha label="Manutenção e Administrativo" valor={-dre.total_manutencao_adm} negativo indent />
            <Linha label="Marketing" valor={-dre.total_marketing} negativo indent />
            <Linha label="Total Despesas Operacionais (SG&A)" valor={-dre.total_despesas_operacionais} negativo negrito separador />
            <Linha label="EBITDA / LAJIDA" valor={dre.ebitda} negrito destaque separador />

            <Linha label="Despesas Financeiras Operacionais" valor={-dre.despesas_financeiras_op} negativo indent />
            <Linha label="Receitas Financeiras" valor={dre.receitas_financeiras} indent />
            <Linha label="Resultado Financeiro" valor={dre.resultado_financeiro} negrito separador />
            <Linha label="P&L Operacional" valor={dre.pl_operacional} negrito destaque separador />

            <Linha label="Despesas Não Operacionais" valor={-dre.despesas_nao_operacionais} negativo indent />
            <Linha label="Lucro Antes do IR e CSLL (LAIR)" valor={dre.lair} negrito destaque separador />
            <Linha label="Provisão para IRPJ" valor={-dre.provisao_irpj} negativo indent />
            <Linha label="Provisão para CSLL" valor={-dre.provisao_csll} negativo indent />
            <Linha label="Lucro Líquido do Exercício" valor={dre.lucro_liquido} negrito destaque separador />
          </tbody>
        </table>
      </div>
    </div>
  );
}
