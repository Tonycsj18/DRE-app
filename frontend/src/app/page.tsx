"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bem-vindo ao DRE App</h1>
        <p className="text-gray-500 mt-1">Escolha como deseja gerar sua Demonstração do Resultado do Exercício.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DRE Simplificada */}
        <button
          onClick={() => router.push("/simples")}
          className="text-left bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-500 hover:shadow-lg p-7 transition-all group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-600 rounded-xl flex items-center justify-center transition-colors">
              <svg className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">Recomendado para iniciantes</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">DRE Simplificada</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-5">
            Para quem quer entender seus números sem precisar de conhecimento contábil.
            Visual, direto e com orientações práticas.
          </p>
          <ul className="space-y-2">
            {[
              "Preenchimento em 5 minutos",
              "Resultado visual com gráficos coloridos",
              "Análise em linguagem simples",
              "Simulador: e se eu cortar X% de despesas?",
              "Comparativo com padrões do setor",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-2 text-blue-600 font-semibold text-sm group-hover:gap-3 transition-all">
            Começar agora
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* DRE Completa */}
        <button
          onClick={() => router.push("/completa")}
          className="text-left bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-400 hover:shadow-lg p-7 transition-all group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-100 group-hover:bg-gray-800 rounded-xl flex items-center justify-center transition-colors">
              <svg className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">Para profissionais e contadores</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">DRE Completa</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-5">
            Todos os campos contábeis detalhados: receita por canal, CMV por categoria,
            despesas operacionais completas, EBITDA, LAIR e muito mais.
          </p>
          <ul className="space-y-2">
            {[
              "Receita separada por canal (dinheiro, PIX, iFood...)",
              "CMV por categoria de fornecedor",
              "Despesas operacionais detalhadas (RH, fixas, marketing...)",
              "EBITDA, P&L, LAIR e margens completas",
              "Benchmarks do setor para cada indicador",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-2 text-gray-600 font-semibold text-sm group-hover:gap-3 transition-all">
            Acessar DRE Completa
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}
