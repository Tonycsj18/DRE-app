"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson } from "@/lib/api";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Categoria { nome: string; valor: number; pct_receita: number; cor: string; status: string; bench_min?: number; bench_max?: number; }
interface DRESimples {
  mes: number; ano: number; tipo_negocio: string; tipo_negocio_label: string;
  receita_total: number; custo_produtos: number; impostos_taxas: number;
  receita_liquida: number; lucro_bruto: number;
  despesa_pessoal: number; despesa_aluguel: number; despesa_utilidades: number;
  despesa_marketing: number; despesa_financeira: number; despesa_outras: number;
  total_despesas: number;
  lucro_liquido: number; margem_lucro: number;
  categorias: Categoria[];
  maior_gasto_nome: string; maior_gasto_pct: number;
  bench_margem_min: number; bench_margem_max: number; margem_status: string;
  narrativa: string[];
  economia_10pct_pessoal: number; economia_10pct_aluguel: number; economia_10pct_outras: number;
}

function BarraCategoria({ cat, max }: { cat: Categoria; max: number }) {
  const width = max > 0 ? (cat.valor / max) * 100 : 0;
  const statusCor = { ok: "bg-green-500", atencao: "bg-yellow-500", critico: "bg-red-500" }[cat.status] ?? "bg-gray-400";
  const textCor = { ok: "text-green-700", atencao: "text-yellow-700", critico: "text-red-700" }[cat.status] ?? "text-gray-600";
  const bgCor = { ok: "bg-green-50", atencao: "bg-yellow-50", critico: "bg-red-50" }[cat.status] ?? "bg-gray-50";

  return (
    <div className={`rounded-xl p-4 ${bgCor}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">{cat.nome}</span>
        <div className="text-right">
          <span className={`text-sm font-bold ${textCor}`}>{BRL(cat.valor)}</span>
          <span className="text-xs text-gray-400 ml-2">{cat.pct_receita.toFixed(1)}%</span>
        </div>
      </div>
      <div className="h-2 bg-white rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${statusCor}`} style={{ width: `${Math.min(width, 100)}%` }} />
      </div>
      {cat.bench_min != null && cat.bench_max != null && (
        <p className={`text-xs mt-1.5 font-medium ${textCor}`}>
          {cat.status === "ok" ? "✓ Dentro do ideal" : cat.status === "atencao" ? "⚠ Acima do ideal" : "✗ Muito acima do ideal"}
          {" — "}referência: {cat.bench_min}% a {cat.bench_max}%
        </p>
      )}
    </div>
  );
}

function Simulador({ dre }: { dre: DRESimples }) {
  const [cortes, setCortes] = useState<Record<string, number>>({
    pessoal: 0, aluguel: 0, utilidades: 0, marketing: 0, outras: 0,
  });

  const lucroSimulado = dre.lucro_liquido +
    dre.despesa_pessoal * (cortes.pessoal / 100) +
    dre.despesa_aluguel * (cortes.aluguel / 100) +
    dre.despesa_utilidades * (cortes.utilidades / 100) +
    dre.despesa_marketing * (cortes.marketing / 100) +
    dre.despesa_outras * (cortes.outras / 100);

  const margemSimulada = dre.receita_total > 0 ? (lucroSimulado / dre.receita_total) * 100 : 0;
  const diferenca = lucroSimulado - dre.lucro_liquido;

  const sliders: Array<{ key: keyof typeof cortes; label: string; valor: number }> = [
    { key: "pessoal", label: "Pessoal", valor: dre.despesa_pessoal },
    { key: "aluguel", label: "Aluguel e Ocupação", valor: dre.despesa_aluguel },
    { key: "utilidades", label: "Utilidades e Operação", valor: dre.despesa_utilidades },
    { key: "marketing", label: "Marketing", valor: dre.despesa_marketing },
    { key: "outras", label: "Outras Despesas", valor: dre.despesa_outras },
  ].filter((s) => s.valor > 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Arraste os sliders para simular reduções em cada categoria e veja o impacto no seu lucro.</p>
      {sliders.map(({ key, label, valor }) => (
        <div key={key}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <span className="text-xs text-blue-700 font-semibold">
              -{cortes[key]}% = +{BRL(valor * cortes[key] / 100)}
            </span>
          </div>
          <input
            type="range" min="0" max="30" step="1"
            value={cortes[key]}
            onChange={(e) => setCortes((prev) => ({ ...prev, [key]: parseInt(e.target.value) }))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>0%</span><span>30%</span>
          </div>
        </div>
      ))}
      <div className={`rounded-xl p-4 ${lucroSimulado >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
        <p className="text-xs font-medium text-gray-500">Novo lucro simulado:</p>
        <p className={`text-3xl font-bold mt-1 ${lucroSimulado >= 0 ? "text-green-700" : "text-red-700"}`}>{BRL(lucroSimulado)}</p>
        <p className="text-sm text-gray-500 mt-1">Margem: {margemSimulada.toFixed(1)}%</p>
        {diferenca > 0 && (
          <p className="text-sm font-semibold text-green-700 mt-2">+{BRL(diferenca)} a mais que o resultado atual</p>
        )}
      </div>
    </div>
  );
}

export default function SimplesResultadoPage() {
  const router = useRouter();
  const [dre, setDre] = useState<DRESimples | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [aba, setAba] = useState<"resultado" | "simulador">("resultado");

  useEffect(() => {
    const dados = sessionStorage.getItem("dreSimplesResultado");
    if (!dados) { router.push("/simples"); return; }
    setDre(JSON.parse(dados));
  }, [router]);

  const handleSalvar = async () => {
    if (!dre) return;
    setSalvando(true);
    setErroSalvar(null);
    try {
      const inputRaw = sessionStorage.getItem("dreSimplesInput");
      await apiJson("/dre/simples/salvar", {
        method: "POST",
        body: JSON.stringify({ input: inputRaw ? JSON.parse(inputRaw) : {}, resultado: dre }),
      });
      setSalvo(true);
    } catch (e: unknown) {
      setErroSalvar(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  if (!dre) return null;

  const isLucro = dre.lucro_liquido >= 0;
  const nomeMes = MESES[dre.mes - 1];
  const maxCategoria = Math.max(...dre.categorias.map((c) => c.valor), 1);

  const margemCor = dre.margem_status === "ok" ? "text-green-700"
    : dre.margem_status === "atencao" ? "text-yellow-700" : "text-red-700";
  const margemBg = dre.margem_status === "ok" ? "bg-green-50 border-green-200"
    : dre.margem_status === "atencao" ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resultado do Mês</h1>
          <p className="text-gray-500 mt-0.5">{nomeMes} {dre.ano} · {dre.tipo_negocio_label}</p>
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
            {salvando ? "Salvando..." : salvo ? "Salvo ✓" : "Salvar"}
          </button>
          <button onClick={() => router.push("/simples")} className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
            Novo mês
          </button>
        </div>
      </div>

      {/* ÍNDICE DE LUCRATIVIDADE — destaque máximo */}
      <div className={`rounded-2xl border-2 p-7 text-center ${margemBg}`}>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Índice de Lucratividade</p>
        <p className={`text-7xl font-black ${margemCor}`}>{dre.margem_lucro.toFixed(1)}%</p>
        <p className={`text-lg font-bold mt-2 ${isLucro ? "text-green-700" : "text-red-700"}`}>
          {isLucro ? "Lucro de" : "Prejuízo de"} {BRL(Math.abs(dre.lucro_liquido))} no mês
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {dre.margem_status === "ok" ? "✅ Dentro do esperado para o seu setor"
            : dre.margem_status === "atencao" ? "⚠️ Abaixo do ideal — vale revisar os custos"
            : "🚨 Resultado crítico — ação imediata necessária"}
        </p>
        <p className="text-xs text-gray-400 mt-2">Referência do setor: {dre.bench_margem_min}% a {dre.bench_margem_max}%</p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {(["resultado", "simulador"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              aba === a ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {a === "resultado" ? "📊 Resultado" : "🎯 Simulador"}
          </button>
        ))}
      </div>

      {aba === "resultado" && (
        <div className="space-y-5">
          {/* Narrativa */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">💬 Análise do mês em linguagem simples</p>
            {dre.narrativa.map((frase, i) => (
              <p key={i} className="text-sm text-gray-700 leading-relaxed">{frase}</p>
            ))}
          </div>

          {/* Fluxo resumido */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <p className="text-sm font-bold text-gray-700 mb-3">💰 Como seu dinheiro se dividiu</p>
            {[
              { label: "Faturamento total", valor: dre.receita_total, cor: "text-gray-900", bg: "bg-gray-100" },
              { label: "Impostos e taxas", valor: -dre.impostos_taxas, cor: "text-red-600", bg: "bg-red-50", indent: true },
              { label: "Custo dos produtos", valor: -dre.custo_produtos, cor: "text-red-600", bg: "bg-red-50", indent: true },
              { label: "O que sobrou para pagar despesas", valor: dre.lucro_bruto, cor: dre.lucro_bruto >= 0 ? "text-blue-700" : "text-red-700", bg: "bg-blue-50", bold: true },
              { label: "Total de despesas", valor: -dre.total_despesas, cor: "text-red-600", bg: "bg-red-50", indent: true },
              { label: isLucro ? "✅ Lucro líquido do mês" : "❌ Prejuízo do mês", valor: dre.lucro_liquido, cor: isLucro ? "text-green-700" : "text-red-700", bg: isLucro ? "bg-green-50" : "bg-red-50", bold: true },
            ].map(({ label, valor, cor, bg, indent, bold }, i) => (
              <div key={i} className={`flex justify-between items-center rounded-lg px-3 py-2 ${bg}`}>
                <span className={`text-sm ${bold ? "font-bold text-gray-800" : "text-gray-600"} ${indent ? "pl-3" : ""}`}>{label}</span>
                <span className={`text-sm font-bold ${cor}`}>{BRL(Math.abs(valor))}</span>
              </div>
            ))}
          </div>

          {/* O que mais pesou */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-bold text-gray-700 mb-4">📊 O que mais está cortando seu lucro</p>
            <div className="space-y-3">
              {dre.categorias
                .filter((c) => c.valor > 0)
                .sort((a, b) => b.valor - a.valor)
                .map((cat) => (
                  <BarraCategoria key={cat.nome} cat={cat} max={maxCategoria} />
                ))}
            </div>
          </div>
        </div>
      )}

      {aba === "simulador" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-sm font-bold text-gray-700 mb-1">🎯 E se eu cortar alguns gastos?</p>
          <Simulador dre={dre} />
        </div>
      )}

      {/* Voltar */}
      <div className="flex justify-center">
        <button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Voltar ao início
        </button>
      </div>
    </div>
  );
}
