"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MesSalvo, DREResult } from "@/types/dre";

const MESES_CURTO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const PCT = (v: number | null | undefined) => v != null ? `${v.toFixed(1)}%` : "—";

function barWidth(valor: number, max: number) {
  if (max === 0) return "0%";
  return `${Math.max(0, (valor / max) * 100).toFixed(1)}%`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [meses, setMeses] = useState<Array<{ mes: number; ano: number; dre: DREResult }>>([]);
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear());

  useEffect(() => {
    const dados: Array<{ mes: number; ano: number; dre: DREResult }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith("dre_")) continue;
      try {
        const entry: MesSalvo = JSON.parse(localStorage.getItem(key)!);
        dados.push({ mes: entry.resultado.mes, ano: entry.resultado.ano, dre: entry.resultado });
      } catch {}
    }
    dados.sort((a, b) => a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes);
    setMeses(dados);
  }, []);

  const anos = [...new Set(meses.map((m) => m.ano))].sort();
  const filtrado = meses.filter((m) => m.ano === anoFiltro);

  const total = (key: keyof DREResult) =>
    filtrado.reduce((acc, { dre }) => acc + (typeof dre[key] === "number" ? (dre[key] as number) : 0), 0);

  const totalReceita = total("receita_bruta");
  const totalROL = total("receita_liquida");
  const totalCMV = total("cmv");
  const totalEBITDA = total("ebitda");
  const totalLucro = total("lucro_liquido");

  const pctCMVAnual = totalReceita > 0 ? (totalCMV / totalReceita) * 100 : null;
  const pctLucroAnual = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : null;
  const margemEBITDA = totalROL > 0 ? (totalEBITDA / totalROL) * 100 : null;

  const maxReceita = Math.max(...filtrado.map((m) => m.dre.receita_bruta), 1);

  const excluirMes = (mes: number, ano: number) => {
    const key = `dre_${ano}_${String(mes).padStart(2, "0")}`;
    localStorage.removeItem(key);
    setMeses((prev) => prev.filter((m) => !(m.mes === mes && m.ano === ano)));
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Anual</h1>
          <p className="text-gray-500 mt-1">Visão consolidada dos resultados mensais</p>
        </div>
        <button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Nova DRE
        </button>
      </div>

      {meses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Nenhum mês salvo ainda</p>
          <p className="text-gray-400 text-sm mt-1">Gere uma DRE e clique em &quot;Salvar no Dashboard&quot; para começar.</p>
          <button onClick={() => router.push("/")} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium">
            Gerar primeira DRE
          </button>
        </div>
      ) : (
        <>
          {/* Filtro de ano */}
          {anos.length > 1 && (
            <div className="flex gap-2">
              {anos.map((ano) => (
                <button
                  key={ano}
                  onClick={() => setAnoFiltro(ano)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${anoFiltro === ano ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                >
                  {ano}
                </button>
              ))}
            </div>
          )}

          {filtrado.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
              Nenhum mês salvo para {anoFiltro}.
            </div>
          ) : (
            <>
              {/* Cards anuais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { titulo: "Receita Bruta Acumulada", valor: totalReceita, cor: "text-gray-900" },
                  { titulo: "EBITDA Acumulado", valor: totalEBITDA, cor: totalEBITDA >= 0 ? "text-blue-700" : "text-red-700", sub: `Margem: ${PCT(margemEBITDA)}` },
                  { titulo: "Lucro Líquido Acumulado", valor: totalLucro, cor: totalLucro >= 0 ? "text-green-700" : "text-red-700", sub: `Margem: ${PCT(pctLucroAnual)}` },
                  { titulo: "CMV % Médio", valor: null, texto: PCT(pctCMVAnual), sub: `Referência: 25% – 35%`, cor: pctCMVAnual !== null ? (pctCMVAnual >= 25 && pctCMVAnual <= 35 ? "text-green-700" : "text-yellow-700") : "text-gray-900" },
                ].map(({ titulo, valor, cor, sub, texto }) => (
                  <div key={titulo} className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{titulo}</p>
                    <p className={`text-2xl font-bold mt-1 ${cor}`}>{valor !== null ? BRL(valor) : (texto ?? "—")}</p>
                    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
                  </div>
                ))}
              </div>

              {/* Gráfico de barras */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h2 className="font-semibold text-gray-800 text-sm">Evolução Mensal — {anoFiltro}</h2>
                </div>
                <div className="p-5 space-y-3">
                  {filtrado.map(({ mes, dre }) => (
                    <div key={mes}>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-medium text-gray-500 w-8">{MESES_CURTO[mes - 1]}</span>
                        <div className="flex-1 flex gap-1 items-end">
                          {/* Receita bruta */}
                          <div className="flex-1 relative h-7 bg-gray-100 rounded overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-blue-200 rounded" style={{ width: barWidth(dre.receita_bruta, maxReceita) }} />
                            <div className="absolute inset-y-0 left-0 bg-blue-600 rounded" style={{ width: barWidth(dre.lucro_liquido > 0 ? dre.lucro_liquido : 0, maxReceita) }} />
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 font-medium w-28 text-right">{BRL(dre.receita_bruta)}</span>
                        <span className={`text-xs font-semibold w-24 text-right ${dre.lucro_liquido >= 0 ? "text-green-700" : "text-red-700"}`}>{BRL(dre.lucro_liquido)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-4 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-200 rounded" /><span className="text-xs text-gray-500">Receita Bruta</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-600 rounded" /><span className="text-xs text-gray-500">Lucro Líquido</span></div>
                  </div>
                </div>
              </div>

              {/* Tabela mensal */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h2 className="font-semibold text-gray-800 text-sm">Comparativo Mensal — {anoFiltro}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["Mês", "Rec. Bruta", "Rec. Líquida", "CMV", "CMV%", "Lucro Bruto", "SG&A", "EBITDA", "EBITDA%", "Lucro Líq.", "Margem", ""].map((h) => (
                          <th key={h} className="px-3 py-2 text-xs font-semibold text-gray-500 text-right first:text-left last:text-center whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtrado.map(({ mes, ano, dre }) => (
                        <tr key={mes} className="hover:bg-gray-50 cursor-pointer" onClick={() => { sessionStorage.setItem("dreResultado", JSON.stringify(dre)); router.push("/resultado"); }}>
                          <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{MESES[mes - 1]}</td>
                          <td className="px-3 py-2.5 text-right text-gray-700">{BRL(dre.receita_bruta)}</td>
                          <td className="px-3 py-2.5 text-right text-gray-700">{BRL(dre.receita_liquida)}</td>
                          <td className="px-3 py-2.5 text-right text-gray-700">{BRL(dre.cmv)}</td>
                          <td className={`px-3 py-2.5 text-right font-medium ${dre.pct_cmv != null && dre.pct_cmv >= 25 && dre.pct_cmv <= 35 ? "text-green-700" : "text-yellow-700"}`}>{PCT(dre.pct_cmv)}</td>
                          <td className="px-3 py-2.5 text-right text-gray-700">{BRL(dre.lucro_bruto)}</td>
                          <td className="px-3 py-2.5 text-right text-gray-700">{BRL(dre.total_despesas_operacionais)}</td>
                          <td className={`px-3 py-2.5 text-right font-medium ${dre.ebitda >= 0 ? "text-blue-700" : "text-red-700"}`}>{BRL(dre.ebitda)}</td>
                          <td className="px-3 py-2.5 text-right text-gray-500">{PCT(dre.margem_ebitda)}</td>
                          <td className={`px-3 py-2.5 text-right font-semibold ${dre.lucro_liquido >= 0 ? "text-green-700" : "text-red-700"}`}>{BRL(dre.lucro_liquido)}</td>
                          <td className="px-3 py-2.5 text-right text-gray-500">{PCT(dre.margem_liquida)}</td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); excluirMes(mes, ano); }}
                              className="text-gray-300 hover:text-red-500 text-xs transition-colors"
                              title="Remover mês"
                            >✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                        <td className="px-3 py-2.5 text-gray-800">Total {anoFiltro}</td>
                        <td className="px-3 py-2.5 text-right text-gray-800">{BRL(totalReceita)}</td>
                        <td className="px-3 py-2.5 text-right text-gray-800">{BRL(totalROL)}</td>
                        <td className="px-3 py-2.5 text-right text-gray-800">{BRL(totalCMV)}</td>
                        <td className={`px-3 py-2.5 text-right ${pctCMVAnual != null && pctCMVAnual >= 25 && pctCMVAnual <= 35 ? "text-green-700" : "text-yellow-700"}`}>{PCT(pctCMVAnual)}</td>
                        <td className="px-3 py-2.5 text-right text-gray-800">{BRL(total("lucro_bruto"))}</td>
                        <td className="px-3 py-2.5 text-right text-gray-800">{BRL(total("total_despesas_operacionais"))}</td>
                        <td className={`px-3 py-2.5 text-right ${totalEBITDA >= 0 ? "text-blue-700" : "text-red-700"}`}>{BRL(totalEBITDA)}</td>
                        <td className="px-3 py-2.5 text-right text-gray-500">{PCT(margemEBITDA)}</td>
                        <td className={`px-3 py-2.5 text-right ${totalLucro >= 0 ? "text-green-700" : "text-red-700"}`}>{BRL(totalLucro)}</td>
                        <td className="px-3 py-2.5 text-right text-gray-500">{PCT(pctLucroAnual)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
