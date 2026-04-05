"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DREResult } from "@/types/dre";

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PCT = (v: number | null) =>
  v !== null ? `${v.toFixed(2)}%` : "—";

function Linha({
  label,
  valor,
  destaque = false,
  negrito = false,
  negativo = false,
  separador = false,
}: {
  label: string;
  valor: number | null;
  destaque?: boolean;
  negrito?: boolean;
  negativo?: boolean;
  separador?: boolean;
}) {
  const cor =
    valor !== null && valor < 0
      ? "text-red-600"
      : valor !== null && valor > 0 && destaque
      ? "text-green-700"
      : "text-gray-800";

  return (
    <>
      {separador && <tr><td colSpan={2} className="py-1"><div className="border-t border-gray-200" /></td></tr>}
      <tr className={destaque ? "bg-gray-50" : ""}>
        <td className={`py-2 pl-4 pr-2 text-sm ${negativo ? "pl-8" : ""} ${negrito ? "font-semibold" : "font-normal"} text-gray-700`}>
          {negativo ? `  (−) ${label}` : label}
        </td>
        <td className={`py-2 pr-4 text-sm text-right ${cor} ${negrito ? "font-semibold" : "font-normal"}`}>
          {valor !== null ? BRL(valor) : "—"}
        </td>
      </tr>
    </>
  );
}

export default function ResultadoPage() {
  const router = useRouter();
  const [dre, setDre] = useState<DREResult | null>(null);

  useEffect(() => {
    const dados = sessionStorage.getItem("dreResultado");
    if (!dados) {
      router.push("/");
      return;
    }
    setDre(JSON.parse(dados));
  }, [router]);

  if (!dre) return null;

  const isLucro = dre.lucro_liquido >= 0;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resultado da DRE</h1>
          <p className="text-gray-500 mt-1">Demonstração do Resultado do Exercício gerada automaticamente.</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Nova DRE
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Receita Líquida</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{BRL(dre.receita_liquida)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Lucro Bruto</p>
          <p className={`text-2xl font-bold mt-1 ${dre.lucro_bruto >= 0 ? "text-gray-900" : "text-red-600"}`}>
            {BRL(dre.lucro_bruto)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Margem bruta: {PCT(dre.margem_bruta)}</p>
        </div>
        <div className={`rounded-xl border p-5 ${isLucro ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <p className={`text-xs font-medium uppercase tracking-wide ${isLucro ? "text-green-600" : "text-red-600"}`}>
            {isLucro ? "Lucro Líquido" : "Prejuízo Líquido"}
          </p>
          <p className={`text-2xl font-bold mt-1 ${isLucro ? "text-green-700" : "text-red-700"}`}>
            {BRL(dre.lucro_liquido)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Margem líquida: {PCT(dre.margem_liquida)}</p>
        </div>
      </div>

      {/* Tabela DRE completa */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-800 text-sm">DRE Detalhada</h2>
        </div>
        <table className="w-full">
          <tbody>
            <Linha label="Receita Bruta de Vendas e Serviços" valor={dre.receita_bruta} negrito />
            <Linha label="Deduções da Receita" valor={-dre.deducoes_receita} negativo />
            <Linha label="Receita Líquida" valor={dre.receita_liquida} negrito destaque separador />
            <Linha label="Custo das Mercadorias/Serviços Vendidos (CMV)" valor={-dre.cmv} negativo />
            <Linha label="Lucro Bruto" valor={dre.lucro_bruto} negrito destaque separador />
            <Linha label="Despesas Comerciais" valor={-dre.despesas_comerciais} negativo />
            <Linha label="Despesas Administrativas" valor={-dre.despesas_administrativas} negativo />
            <Linha label="Despesas Financeiras Líquidas" valor={-dre.despesas_financeiras_liquidas} negativo />
            <Linha label="EBITDA" valor={dre.ebitda} negrito destaque separador />
            <Linha label="Depreciação e Amortização" valor={-dre.depreciacao_amortizacao} negativo />
            <Linha label="EBIT (Lucro Operacional)" valor={dre.ebit} negrito destaque separador />
            <Linha label="Resultado Não Operacional" valor={dre.resultado_nao_operacional} />
            <Linha label="LAIR (Lucro Antes do IR e CSLL)" valor={dre.lair} negrito destaque separador />
            <Linha label="Provisão para IRPJ" valor={-dre.provisao_irpj} negativo />
            <Linha label="Provisão para CSLL" valor={-dre.provisao_csll} negativo />
            <Linha label="Participações nos Lucros" valor={-dre.participacoes} negativo />
            <Linha label="Lucro Líquido do Exercício" valor={dre.lucro_liquido} negrito destaque separador />
          </tbody>
        </table>
      </div>
    </div>
  );
}
