"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DREResult } from "@/types/dre";

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PCT = (v: number | null | undefined) =>
  v != null ? `${v.toFixed(1)}%` : "—";

function Linha({
  label,
  valor,
  destaque = false,
  negrito = false,
  negativo = false,
  separador = false,
  indent = false,
}: {
  label: string;
  valor: number | null;
  destaque?: boolean;
  negrito?: boolean;
  negativo?: boolean;
  separador?: boolean;
  indent?: boolean;
}) {
  const cor =
    valor !== null && valor < 0
      ? "text-red-600"
      : valor !== null && valor > 0 && destaque
      ? "text-green-700"
      : "text-gray-800";

  return (
    <>
      {separador && (
        <tr>
          <td colSpan={2} className="py-1">
            <div className="border-t border-gray-200" />
          </td>
        </tr>
      )}
      <tr className={destaque ? "bg-gray-50" : ""}>
        <td className={`py-2 pr-2 text-sm ${indent ? "pl-10" : "pl-4"} ${negrito ? "font-semibold" : "font-normal"} text-gray-700`}>
          {negativo ? `(−) ${label}` : label}
        </td>
        <td className={`py-2 pr-4 text-sm text-right ${cor} ${negrito ? "font-semibold" : "font-normal"}`}>
          {valor !== null ? BRL(valor) : "—"}
        </td>
      </tr>
    </>
  );
}

function Benchmark({
  label,
  valor,
  referencia,
  descricao,
}: {
  label: string;
  valor: number | null | undefined;
  referencia: string;
  descricao: string;
}) {
  const dentro =
    valor != null &&
    (() => {
      if (label === "CMV") return valor >= 25 && valor <= 35;
      if (label === "Folha de Pagamento") return valor >= 25 && valor <= 30;
      if (label === "Custos de Ocupação") return valor <= 10;
      if (label === "Lucro Líquido") return valor >= 10 && valor <= 20;
      return true;
    })();

  const cor = valor == null ? "gray" : dentro ? "green" : "yellow";

  const cores = {
    gray: { bg: "bg-gray-50", border: "border-gray-200", badge: "bg-gray-100 text-gray-600", icon: "text-gray-400" },
    green: { bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-700", icon: "text-green-500" },
    yellow: { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-700", icon: "text-yellow-500" },
  }[cor];

  return (
    <div className={`rounded-xl border p-4 ${cores.bg} ${cores.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{PCT(valor)}</p>
          <p className="text-xs text-gray-500 mt-1">{descricao}</p>
        </div>
        <div className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${cores.badge}`}>
          Ref: {referencia}
        </div>
      </div>
      {valor != null && (
        <p className={`text-xs mt-2 font-medium ${cores.icon}`}>
          {dentro ? "Dentro do parâmetro de mercado" : "Fora do parâmetro de mercado"}
        </p>
      )}
    </div>
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
          <p className="text-xs text-gray-400 mt-1">Margem bruta: {PCT(dre.margem_bruta)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Resultado Operacional</p>
          <p className={`text-2xl font-bold mt-1 ${dre.resultado_operacional >= 0 ? "text-gray-900" : "text-red-600"}`}>
            {BRL(dre.resultado_operacional)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Margem operacional: {PCT(dre.margem_operacional)}</p>
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

      {/* Benchmarks do setor */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-800 text-sm">Indicadores de Referência — Gastronomia</h2>
          <p className="text-xs text-gray-500 mt-0.5">Compare os resultados com os parâmetros de mercado para restaurantes, bares, cafeterias e padarias</p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Benchmark
            label="CMV"
            valor={dre.pct_cmv}
            referencia="25% – 35%"
            descricao="Custo da mercadoria sobre a receita bruta"
          />
          <Benchmark
            label="Folha de Pagamento"
            valor={dre.pct_folha}
            referencia="25% – 30%"
            descricao="Salários e encargos sobre a receita bruta"
          />
          <Benchmark
            label="Custos de Ocupação"
            valor={dre.pct_ocupacao}
            referencia="até 10%"
            descricao="Aluguel e condomínio sobre a receita bruta"
          />
          <Benchmark
            label="Lucro Líquido"
            valor={dre.pct_lucro_liquido}
            referencia="10% – 20%"
            descricao="Lucro líquido sobre a receita bruta"
          />
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
            <Linha label="Impostos sobre Vendas" valor={-dre.deducoes_receita} negativo indent />
            <Linha label="Receita Líquida" valor={dre.receita_liquida} negrito destaque separador />

            <Linha label="Custo das Mercadorias Vendidas (CMV)" valor={-dre.cmv} negativo />
            <Linha label="Lucro Bruto" valor={dre.lucro_bruto} negrito destaque separador />

            <Linha label="Folha de Pagamento (salários + encargos)" valor={-dre.folha_pagamento} negativo indent />
            <Linha label="Aluguel e Condomínio" valor={-dre.aluguel} negativo indent />
            <Linha label="Energia, Água e Gás" valor={-dre.energia_agua_gas} negativo indent />
            <Linha label="Marketing e Publicidade" valor={-dre.marketing} negativo indent />
            <Linha label="Manutenção de Equipamentos" valor={-dre.manutencao} negativo indent />
            <Linha label="Despesas Administrativas" valor={-dre.despesas_administrativas} negativo indent />
            <Linha label="Outras Despesas Operacionais" valor={-dre.outras_despesas} negativo indent />
            <Linha label="Total de Despesas Operacionais" valor={-dre.total_despesas_operacionais} negativo negrito separador />

            <Linha label="Resultado Operacional" valor={dre.resultado_operacional} negrito destaque separador />

            <Linha label="Despesas Financeiras" valor={-dre.despesas_financeiras} negativo indent />
            <Linha label="Receitas Financeiras" valor={dre.receitas_financeiras} indent />
            <Linha label="Resultado Financeiro" valor={dre.resultado_financeiro} negrito separador />

            <Linha label="Lucro Antes do IR e CSLL (LAIR)" valor={dre.lair} negrito destaque separador />
            <Linha label="Provisão para IRPJ" valor={-dre.provisao_irpj} negativo indent />
            <Linha label="Provisão para CSLL" valor={-dre.provisao_csll} negativo indent />
            <Linha label="Participações nos Lucros (PLR)" valor={-dre.participacoes} negativo indent />

            <Linha label="Lucro Líquido do Exercício" valor={dre.lucro_liquido} negrito destaque separador />
          </tbody>
        </table>
      </div>
    </div>
  );
}
