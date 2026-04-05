"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DREInput, DadosExtraidos } from "@/types/dre";

const CAMPOS_LABELS: Record<keyof DREInput, string> = {
  receita_bruta: "Receita Bruta de Vendas",
  devolucoes: "Devoluções",
  abatimentos: "Abatimentos",
  impostos_vendas: "Impostos sobre Vendas (ICMS/PIS/COFINS/ISS)",
  estoque_inicial: "Estoque Inicial",
  compras: "Compras / Custo de Produção",
  estoque_final: "Estoque Final",
  despesas_comerciais: "Despesas Comerciais",
  despesas_administrativas: "Despesas Administrativas",
  despesas_financeiras: "Despesas Financeiras",
  receitas_financeiras: "Receitas Financeiras",
  depreciacao_amortizacao: "Depreciação e Amortização",
  resultado_nao_operacional: "Resultado Não Operacional",
  aliquota_irpj: "Alíquota IRPJ (ex: 0.15)",
  aliquota_csll: "Alíquota CSLL (ex: 0.09)",
  participacoes: "Participações nos Lucros",
};

const VALORES_PADRAO: DREInput = {
  receita_bruta: 0,
  devolucoes: 0,
  abatimentos: 0,
  impostos_vendas: 0,
  estoque_inicial: 0,
  compras: 0,
  estoque_final: 0,
  despesas_comerciais: 0,
  despesas_administrativas: 0,
  despesas_financeiras: 0,
  receitas_financeiras: 0,
  depreciacao_amortizacao: 0,
  resultado_nao_operacional: 0,
  aliquota_irpj: 0.15,
  aliquota_csll: 0.09,
  participacoes: 0,
};

export default function Home() {
  const router = useRouter();
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [arrastando, setArrastando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dadosForm, setDadosForm] = useState<DREInput>(VALORES_PADRAO);
  const [modoManual, setModoManual] = useState(false);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    const novos = Array.from(e.dataTransfer.files).filter((f) =>
      ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"].includes(f.type)
    );
    setArquivos((prev) => [...prev, ...novos]);
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArquivos((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removerArquivo = (index: number) => {
    setArquivos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (arquivos.length === 0) return;
    setCarregando(true);
    setErro(null);
    try {
      const formData = new FormData();
      arquivos.forEach((f) => formData.append("arquivos", f));
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API}/dre/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Erro ao processar documentos.");
      const data: DadosExtraidos = await res.json();
      setDadosForm({ ...VALORES_PADRAO, ...data.dados_extraidos });
      setModoManual(true);
    } catch {
      setErro("Não foi possível processar os documentos. Verifique se o servidor está rodando.");
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
        body: JSON.stringify(dadosForm),
      });
      if (!res.ok) throw new Error("Erro ao calcular DRE.");
      const resultado = await res.json();
      sessionStorage.setItem("dreResultado", JSON.stringify(resultado));
      router.push("/resultado");
    } catch {
      setErro("Não foi possível calcular a DRE. Verifique se o servidor está rodando.");
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
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              arrastando ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:border-blue-400"
            }`}
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
                <input type="file" multiple accept=".pdf,.xlsx,.xls" className="hidden" onChange={onFileInput} />
              </label>
            </div>
          </div>

          {arquivos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {arquivos.map((arquivo, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                      <span className="text-red-600 text-xs font-bold uppercase">
                        {arquivo.name.split(".").pop()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700">{arquivo.name}</span>
                  </div>
                  <button onClick={() => removerArquivo(i)} className="text-gray-400 hover:text-red-500 transition-colors text-sm">
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={arquivos.length === 0 || carregando}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              {carregando ? "Processando..." : "Processar documentos"}
            </button>
            <button
              onClick={() => setModoManual(true)}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Preencher manualmente
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Revise e ajuste os valores</h2>
            <button onClick={() => setModoManual(false)} className="text-sm text-blue-600 hover:underline">
              ← Voltar ao upload
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(CAMPOS_LABELS) as Array<keyof DREInput>).map((campo) => (
              <div key={campo}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {CAMPOS_LABELS[campo]}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={dadosForm[campo]}
                  onChange={(e) =>
                    setDadosForm((prev) => ({ ...prev, [campo]: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleCalcular}
            disabled={carregando}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            {carregando ? "Calculando..." : "Gerar DRE"}
          </button>
        </div>
      )}

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {erro}
        </div>
      )}
    </div>
  );
}
