"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DREResult } from "@/types/dre";
import { apiJson, apiFetch, getUsername } from "@/lib/api";

const MESES_CURTO = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const PCT = (v: number | null | undefined) => v != null ? `${v.toFixed(1)}%` : "—";

interface HistoricoItem { mes: number; ano: number; resultado: DREResult; }

interface DRESimples {
  mes: number; ano: number; tipo_negocio: string; tipo_negocio_label: string;
  receita_total: number; lucro_liquido: number; margem_lucro: number; margem_status: string;
  total_despesas: number;
}
interface HistoricoSimplesItem { mes: number; ano: number; resultado: DRESimples; }

export default function DashboardPage() {
  const router = useRouter();
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [historicoSimples, setHistoricoSimples] = useState<HistoricoSimplesItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear());
  const [aba, setAba] = useState<"completa" | "simples">("simples");
  const username = getUsername();

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [completa, simples] = await Promise.all([
        apiJson<HistoricoItem[]>("/dre/historico").catch(() => [] as HistoricoItem[]),
        apiJson<HistoricoSimplesItem[]>("/dre/simples/historico").catch(() => [] as HistoricoSimplesItem[]),
      ]);
      setHistorico(completa);
      setHistoricoSimples(simples);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar histórico");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const excluirCompleta = async (mes: number, ano: number) => {
    try {
      await apiFetch(`/dre/historico/${ano}/${mes}`, { method: "DELETE" });
      setHistorico((prev) => prev.filter((h) => !(h.mes === mes && h.ano === ano)));
    } catch {}
  };

  const excluirSimples = async (mes: number, ano: number) => {
    try {
      await apiFetch(`/dre/simples/historico/${ano}/${mes}`, { method: "DELETE" });
      setHistoricoSimples((prev) => prev.filter((h) => !(h.mes === mes && h.ano === ano)));
    } catch {}
  };

  // ---- COMPLETA ----
  const anosCompleta = [...new Set(historico.map((h) => h.ano))].sort();
  const filtradoCompleta = historico.filter((h) => h.ano === anoFiltro);

  const total = (key: keyof DREResult) =>
    filtradoCompleta.reduce((acc, { resultado }) => acc + (typeof resultado[key] === "number" ? (resultado[key] as number) : 0), 0);

  const totalReceita = total("receita_bruta");
  const totalROL = total("receita_liquida");
  const totalCMV = total("cmv");
  const totalEBITDA = total("ebitda");
  const totalLucro = total("lucro_liquido");
  const pctCMVAnual = totalReceita > 0 ? (totalCMV / totalReceita) * 100 : null;
  const pctLucroAnual = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : null;
  const margemEBITDA = totalROL > 0 ? (totalEBITDA / totalROL) * 100 : null;
  const maxReceita = Math.max(...filtradoCompleta.map((h) => h.resultado.receita_bruta), 1);

  // ---- SIMPLES ----
  const anosSimples = [...new Set(historicoSimples.map((h) => h.ano))].sort();
  const filtradoSimples = historicoSimples.filter((h) => h.ano === anoFiltro);
  const totalReceitaSimples = filtradoSimples.reduce((acc, { resultado }) => acc + resultado.receita_total, 0);
  const totalLucroSimples = filtradoSimples.reduce((acc, { resultado }) => acc + resultado.lucro_liquido, 0);
  const margemMediaSimples = totalReceitaSimples > 0 ? (totalLucroSimples / totalReceitaSimples) * 100 : null;
  const maxReceitaSimples = Math.max(...filtradoSimples.map((h) => h.resultado.receita_total), 1);

  // Anos para o filtro ativo
  const anosAtivos = aba === "completa" ? anosCompleta : anosSimples;

  const hasCompleta = historico.length > 0;
  const hasSimples = historicoSimples.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Anual</h1>
          {username && <p className="text-gray-500 mt-1">Dados de <span className="font-medium">{username}</span></p>}
        </div>
        <button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Nova DRE
        </button>
      </div>

      {carregando ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm font-medium">Carregando dados...</p>
          <p className="text-gray-400 text-xs mt-1">Pode levar alguns segundos na primeira vez</p>
        </div>
      ) : erro ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{erro}</div>
      ) : !hasCompleta && !hasSimples ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Nenhum mês salvo ainda</p>
          <p className="text-gray-400 text-sm mt-1">Gere uma DRE e clique em &quot;Salvar no Dashboard&quot;.</p>
          <button onClick={() => router.push("/")} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium">
            Gerar primeira DRE
          </button>
        </div>
      ) : (
        <>
          {/* Abas */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-sm">
            {(["simples", "completa"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAba(a)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  aba === a ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {a === "simples" ? "Simplificada" : "Completa"}
              </button>
            ))}
          </div>

          {/* Filtro de ano */}
          {anosAtivos.length > 1 && (
            <div className="flex gap-2">
              {anosAtivos.map((ano) => (
                <button key={ano} onClick={() => setAnoFiltro(ano)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${anoFiltro === ano ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                  {ano}
                </button>
              ))}
            </div>
          )}

          {/* ====== ABA SIMPLES ====== */}
          {aba === "simples" && (
            !hasSimples ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500 font-medium">Nenhuma DRE Simplificada salva</p>
                <p className="text-gray-400 text-sm mt-1">Use a DRE Simplificada e clique em &quot;Salvar&quot; para ver o histórico aqui.</p>
                <button onClick={() => router.push("/simples")} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium">
                  Fazer DRE Simplificada
                </button>
              </div>
            ) : filtradoSimples.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">Nenhum mês salvo para {anoFiltro}.</div>
            ) : (
              <>
                {/* Resumo anual simples */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Faturamento Acumulado</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{BRL(totalReceitaSimples)}</p>
                  </div>
                  <div className={`rounded-xl border p-5 ${totalLucroSimples >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                    <p className={`text-xs font-medium uppercase tracking-wide ${totalLucroSimples >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {totalLucroSimples >= 0 ? "Lucro Acumulado" : "Prejuízo Acumulado"}
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${totalLucroSimples >= 0 ? "text-green-700" : "text-red-700"}`}>{BRL(totalLucroSimples)}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Margem Média</p>
                    <p className={`text-2xl font-bold mt-1 ${margemMediaSimples != null && margemMediaSimples >= 10 ? "text-green-700" : "text-yellow-700"}`}>
                      {PCT(margemMediaSimples)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Referência: 10% – 20%</p>
                  </div>
                </div>

                {/* Gráfico simples */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h2 className="font-semibold text-gray-800 text-sm">Evolução Mensal — {anoFiltro}</h2>
                  </div>
                  <div className="p-5 space-y-3">
                    {filtradoSimples.map(({ mes, resultado: dre }) => (
                      <div key={mes}>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-500 w-8">{MESES_CURTO[mes - 1]}</span>
                          <div className="flex-1 relative h-7 bg-gray-100 rounded overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-blue-200 rounded" style={{ width: `${Math.max(0, (dre.receita_total / maxReceitaSimples) * 100).toFixed(1)}%` }} />
                            <div className="absolute inset-y-0 left-0 bg-blue-600 rounded" style={{ width: `${Math.max(0, ((dre.lucro_liquido > 0 ? dre.lucro_liquido : 0) / maxReceitaSimples) * 100).toFixed(1)}%` }} />
                          </div>
                          <span className="text-xs text-gray-600 font-medium w-28 text-right">{BRL(dre.receita_total)}</span>
                          <span className={`text-xs font-semibold w-24 text-right ${dre.lucro_liquido >= 0 ? "text-green-700" : "text-red-700"}`}>{BRL(dre.lucro_liquido)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-4 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-200 rounded" /><span className="text-xs text-gray-500">Faturamento</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-600 rounded" /><span className="text-xs text-gray-500">Lucro Líquido</span></div>
                    </div>
                  </div>
                </div>

                {/* Tabela simples */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h2 className="font-semibold text-gray-800 text-sm">Comparativo Mensal — {anoFiltro}</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {["Mês","Tipo de Negócio","Faturamento","Total Despesas","Lucro Líquido","Margem",""].map((h) => (
                            <th key={h} className="px-3 py-2 text-xs font-semibold text-gray-500 text-right first:text-left last:text-center whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filtradoSimples.map(({ mes, ano, resultado: dre }) => (
                          <tr key={mes} className="hover:bg-gray-50">
                            <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{MESES[mes - 1]}</td>
                            <td className="px-3 py-2.5 text-gray-600">{dre.tipo_negocio_label}</td>
                            <td className="px-3 py-2.5 text-right text-gray-700">{BRL(dre.receita_total)}</td>
                            <td className="px-3 py-2.5 text-right text-gray-700">{BRL(dre.total_despesas)}</td>
                            <td className={`px-3 py-2.5 text-right font-semibold ${dre.lucro_liquido >= 0 ? "text-green-700" : "text-red-700"}`}>{BRL(dre.lucro_liquido)}</td>
                            <td className={`px-3 py-2.5 text-right font-medium ${dre.margem_status === "ok" ? "text-green-700" : dre.margem_status === "atencao" ? "text-yellow-700" : "text-red-700"}`}>
                              {dre.margem_lucro.toFixed(1)}%
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <button onClick={() => excluirSimples(mes, ano)}
                                className="text-gray-300 hover:text-red-500 text-xs transition-colors" title="Remover">✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                          <td className="px-3 py-2.5 text-gray-800">Total {anoFiltro}</td>
                          <td className="px-3 py-2.5 text-gray-400 text-sm font-normal">{filtradoSimples.length} {filtradoSimples.length === 1 ? "mês" : "meses"}</td>
                          <td className="px-3 py-2.5 text-right text-gray-800">{BRL(totalReceitaSimples)}</td>
                          <td className="px-3 py-2.5 text-right text-gray-800">{BRL(filtradoSimples.reduce((acc, { resultado }) => acc + resultado.total_despesas, 0))}</td>
                          <td className={`px-3 py-2.5 text-right ${totalLucroSimples >= 0 ? "text-green-700" : "text-red-700"}`}>{BRL(totalLucroSimples)}</td>
                          <td className={`px-3 py-2.5 text-right ${margemMediaSimples != null && margemMediaSimples >= 10 ? "text-green-700" : "text-yellow-700"}`}>{PCT(margemMediaSimples)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            )
          )}

          {/* ====== ABA COMPLETA ====== */}
          {aba === "completa" && (
            !hasCompleta ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500 font-medium">Nenhuma DRE Completa salva</p>
                <p className="text-gray-400 text-sm mt-1">Use a DRE Completa e clique em &quot;Salvar no Dashboard&quot; para ver o histórico aqui.</p>
                <button onClick={() => router.push("/completa")} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium">
                  Fazer DRE Completa
                </button>
              </div>
            ) : filtradoCompleta.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">Nenhum mês salvo para {anoFiltro}.</div>
            ) : (
              <>
                {/* Totais anuais */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { titulo: "Receita Bruta Acumulada", valor: totalReceita, cor: "text-gray-900" },
                    { titulo: "EBITDA Acumulado", valor: totalEBITDA, cor: totalEBITDA >= 0 ? "text-blue-700" : "text-red-700", sub: `Margem: ${PCT(margemEBITDA)}` },
                    { titulo: "Lucro Líquido Acumulado", valor: totalLucro, cor: totalLucro >= 0 ? "text-green-700" : "text-red-700", sub: `Margem: ${PCT(pctLucroAnual)}` },
                    { titulo: "CMV % Médio", valor: null as number | null, texto: PCT(pctCMVAnual), sub: "Referência: 25% – 35%", cor: pctCMVAnual !== null ? (pctCMVAnual >= 25 && pctCMVAnual <= 35 ? "text-green-700" : "text-yellow-700") : "text-gray-900" },
                  ].map(({ titulo, valor, cor, sub, texto }) => (
                    <div key={titulo} className="bg-white rounded-xl border border-gray-200 p-5">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{titulo}</p>
                      <p className={`text-2xl font-bold mt-1 ${cor}`}>{valor !== null ? BRL(valor) : (texto ?? "—")}</p>
                      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
                    </div>
                  ))}
                </div>

                {/* Gráfico */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h2 className="font-semibold text-gray-800 text-sm">Evolução Mensal — {anoFiltro}</h2>
                  </div>
                  <div className="p-5 space-y-3">
                    {filtradoCompleta.map(({ mes, resultado: dre }) => (
                      <div key={mes}>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-500 w-8">{MESES_CURTO[mes - 1]}</span>
                          <div className="flex-1 relative h-7 bg-gray-100 rounded overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-blue-200 rounded" style={{ width: `${Math.max(0, (dre.receita_bruta / maxReceita) * 100).toFixed(1)}%` }} />
                            <div className="absolute inset-y-0 left-0 bg-blue-600 rounded" style={{ width: `${Math.max(0, ((dre.lucro_liquido > 0 ? dre.lucro_liquido : 0) / maxReceita) * 100).toFixed(1)}%` }} />
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

                {/* Tabela */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h2 className="font-semibold text-gray-800 text-sm">Comparativo Mensal — {anoFiltro}</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {["Mês","Rec. Bruta","Rec. Líquida","CMV","CMV%","Lucro Bruto","SG&A","EBITDA","EBITDA%","Lucro Líq.","Margem",""].map((h) => (
                            <th key={h} className="px-3 py-2 text-xs font-semibold text-gray-500 text-right first:text-left last:text-center whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filtradoCompleta.map(({ mes, ano, resultado: dre }) => (
                          <tr key={mes} className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => { sessionStorage.setItem("dreResultado", JSON.stringify(dre)); router.push("/completa/resultado"); }}>
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
                              <button onClick={(e) => { e.stopPropagation(); excluirCompleta(mes, ano); }}
                                className="text-gray-300 hover:text-red-500 text-xs transition-colors" title="Remover">✕</button>
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
            )
          )}
        </>
      )}
    </div>
  );
}
