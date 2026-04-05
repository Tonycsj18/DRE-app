"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const ANO_ATUAL = new Date().getFullYear();
const MES_ATUAL = new Date().getMonth() + 1;
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TIPOS_NEGOCIO = [
  { value: "gastronomia", label: "🍽️ Restaurante / Bar / Cafeteria / Padaria" },
  { value: "comercio",    label: "🛍️ Comércio / Loja" },
  { value: "servicos",    label: "💼 Serviços / Consultoria" },
  { value: "ecommerce",   label: "📦 E-commerce" },
];

interface FormData {
  mes: number; ano: number; tipo_negocio: string;
  receita_total: number;
  custo_produtos: number; impostos_taxas: number;
  despesa_pessoal: number; despesa_aluguel: number;
  despesa_utilidades: number; despesa_marketing: number;
  despesa_financeira: number; despesa_outras: number;
}

const PADRAO: FormData = {
  mes: MES_ATUAL, ano: ANO_ATUAL, tipo_negocio: "gastronomia",
  receita_total: 0, custo_produtos: 0, impostos_taxas: 0,
  despesa_pessoal: 0, despesa_aluguel: 0, despesa_utilidades: 0,
  despesa_marketing: 0, despesa_financeira: 0, despesa_outras: 0,
};

function CampoValor({ label, dica, valor, onChange }: {
  label: string; dica?: string; valor: number; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      {dica && <p className="text-xs text-gray-400">{dica}</p>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">R$</span>
        <input
          type="number" min="0" step="0.01"
          value={valor || ""}
          placeholder="0,00"
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

export default function SimplesPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(PADRAO);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState(1); // 1=tipo+periodo, 2=receita, 3=despesas

  const set = (key: keyof FormData) => (v: number | string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const totalDespesas =
    form.custo_produtos + form.impostos_taxas +
    form.despesa_pessoal + form.despesa_aluguel +
    form.despesa_utilidades + form.despesa_marketing +
    form.despesa_financeira + form.despesa_outras;

  const lucroEstimado = form.receita_total - totalDespesas;

  const handleCalcular = async () => {
    if (form.receita_total === 0) { setErro("Informe ao menos a Receita Total."); return; }
    setCarregando(true);
    setErro(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch(`${API}/dre/simples/calcular`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const resultado = await res.json();
      sessionStorage.setItem("dreSimplesResultado", JSON.stringify(resultado));
      sessionStorage.setItem("dreSimplesInput", JSON.stringify(form));
      router.push("/simples/resultado");
    } catch (e: unknown) {
      if ((e as Error).name === "AbortError") {
        setErro("O servidor demorou para responder. Aguarde alguns segundos e tente novamente.");
      } else {
        setErro("Não foi possível calcular. Verifique sua conexão e tente novamente.");
      }
    } finally {
      clearTimeout(timeout);
      setCarregando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DRE Simplificada</h1>
          <p className="text-gray-500 text-sm">Preencha os dados do mês e veja seu resultado em segundos.</p>
        </div>
      </div>

      {/* Progresso */}
      <div className="flex gap-2">
        {["Tipo e período", "Receita", "Despesas"].map((label, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1.5 rounded-full transition-colors ${etapa > i ? "bg-blue-600" : etapa === i + 1 ? "bg-blue-400" : "bg-gray-200"}`} />
            <p className={`text-xs mt-1 font-medium ${etapa === i + 1 ? "text-blue-600" : "text-gray-400"}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* ETAPA 1 — Tipo e período */}
      {etapa === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-800">Qual é o seu tipo de negócio?</h2>
          <div className="grid grid-cols-1 gap-3">
            {TIPOS_NEGOCIO.map((t) => (
              <button
                key={t.value}
                onClick={() => setForm((p) => ({ ...p, tipo_negocio: t.value }))}
                className={`text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  form.tipo_negocio === t.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mês de referência</label>
              <select
                value={form.mes}
                onChange={(e) => setForm((p) => ({ ...p, mes: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ano</label>
              <input
                type="number" value={form.ano}
                onChange={(e) => setForm((p) => ({ ...p, ano: parseInt(e.target.value) || ANO_ATUAL }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button onClick={() => setEtapa(2)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors">
            Continuar →
          </button>
        </div>
      )}

      {/* ETAPA 2 — Receita */}
      {etapa === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-800">Quanto você faturou em {MESES[form.mes - 1]}?</h2>
            <p className="text-sm text-gray-500 mt-1">Some todas as vendas do mês — dinheiro, cartão, PIX, delivery, etc.</p>
          </div>

          <CampoValor
            label="Total de Vendas (Receita Bruta)"
            dica="Some tudo que entrou de venda, antes de qualquer desconto ou imposto"
            valor={form.receita_total}
            onChange={set("receita_total") as (v: number) => void}
          />
          <CampoValor
            label="Impostos e Taxas sobre as Vendas"
            dica="Simples Nacional, ICMS, taxas de cartão e de aplicativos de delivery"
            valor={form.impostos_taxas}
            onChange={set("impostos_taxas") as (v: number) => void}
          />
          <CampoValor
            label="Custo do que você vendeu (CMV)"
            dica="Quanto custou comprar ou produzir o que você vendeu no mês"
            valor={form.custo_produtos}
            onChange={set("custo_produtos") as (v: number) => void}
          />

          {form.receita_total > 0 && (
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-600 font-medium">O que sobrou até aqui (Lucro Bruto):</p>
              <p className={`text-2xl font-bold mt-1 ${form.receita_total - form.impostos_taxas - form.custo_produtos >= 0 ? "text-blue-700" : "text-red-600"}`}>
                {(form.receita_total - form.impostos_taxas - form.custo_produtos).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setEtapa(1)} className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-semibold transition-colors hover:bg-gray-50">
              ← Voltar
            </button>
            <button onClick={() => setEtapa(3)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors">
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 3 — Despesas */}
      {etapa === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-800">Quais foram seus gastos em {MESES[form.mes - 1]}?</h2>
            <p className="text-sm text-gray-500 mt-1">Preencha cada categoria com o total do mês. Deixe em branco se não se aplicar.</p>
          </div>

          <div className="space-y-4">
            <CampoValor
              label="👥 Pessoal"
              dica="Salários, encargos, férias, pró-labore, benefícios"
              valor={form.despesa_pessoal}
              onChange={set("despesa_pessoal") as (v: number) => void}
            />
            <CampoValor
              label="🏠 Aluguel e Ocupação"
              dica="Aluguel, condomínio, IPTU, taxas do imóvel"
              valor={form.despesa_aluguel}
              onChange={set("despesa_aluguel") as (v: number) => void}
            />
            <CampoValor
              label="⚡ Utilidades e Operação"
              dica="Energia, água, gás, internet, sistemas, manutenção"
              valor={form.despesa_utilidades}
              onChange={set("despesa_utilidades") as (v: number) => void}
            />
            <CampoValor
              label="📣 Marketing e Publicidade"
              dica="Anúncios, redes sociais, materiais, ações promocionais"
              valor={form.despesa_marketing}
              onChange={set("despesa_marketing") as (v: number) => void}
            />
            <CampoValor
              label="🏦 Parcelas e Juros"
              dica="Parcelas de empréstimos, juros bancários, financiamentos"
              valor={form.despesa_financeira}
              onChange={set("despesa_financeira") as (v: number) => void}
            />
            <CampoValor
              label="📋 Outras Despesas"
              dica="Contabilidade, seguros, material de escritório, outros"
              valor={form.despesa_outras}
              onChange={set("despesa_outras") as (v: number) => void}
            />
          </div>

          {/* Preview do lucro */}
          {form.receita_total > 0 && (
            <div className={`rounded-xl p-4 ${lucroEstimado >= 0 ? "bg-green-50" : "bg-red-50"}`}>
              <p className={`text-xs font-medium ${lucroEstimado >= 0 ? "text-green-600" : "text-red-600"}`}>
                {lucroEstimado >= 0 ? "Lucro estimado do mês:" : "Prejuízo estimado do mês:"}
              </p>
              <p className={`text-2xl font-bold mt-1 ${lucroEstimado >= 0 ? "text-green-700" : "text-red-700"}`}>
                {lucroEstimado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {form.receita_total > 0 ? `${((lucroEstimado / form.receita_total) * 100).toFixed(1)}% do faturamento` : ""}
              </p>
            </div>
          )}

          {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{erro}</div>}

          <div className="flex gap-3">
            <button onClick={() => setEtapa(2)} className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-semibold transition-colors hover:bg-gray-50">
              ← Voltar
            </button>
            <button
              onClick={handleCalcular}
              disabled={carregando}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              {carregando ? "Calculando..." : "Ver resultado completo →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
