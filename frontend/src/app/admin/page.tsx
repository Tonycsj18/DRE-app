"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiJson, isAdmin } from "@/lib/api";

interface Usuario {
  id: number;
  username: string;
  is_admin: number;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Novo usuário
  const [novoUsername, setNovoUsername] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoAdmin, setNovoAdmin] = useState(false);
  const [criando, setCriando] = useState(false);
  const [erroCriar, setErroCriar] = useState<string | null>(null);

  // Alterar senha
  const [senhaEdit, setSenhaEdit] = useState<Record<string, string>>({});
  const [salvandoSenha, setSalvandoSenha] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin()) { router.push("/"); return; }
  }, [router]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const data = await apiJson<Usuario[]>("/usuarios");
      setUsuarios(data);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar usuários");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const criarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoUsername || !novaSenha) return;
    setCriando(true);
    setErroCriar(null);
    try {
      await apiJson("/usuarios", {
        method: "POST",
        body: JSON.stringify({ username: novoUsername, password: novaSenha, is_admin: novoAdmin }),
      });
      setNovoUsername("");
      setNovaSenha("");
      setNovoAdmin(false);
      await carregar();
    } catch (e: unknown) {
      setErroCriar(e instanceof Error ? e.message : "Erro ao criar usuário");
    } finally {
      setCriando(false);
    }
  };

  const deletarUsuario = async (username: string) => {
    if (!confirm(`Excluir usuário "${username}" e todos os seus dados? Esta ação não pode ser desfeita.`)) return;
    try {
      await apiJson(`/usuarios/${username}`, { method: "DELETE" });
      setUsuarios((prev) => prev.filter((u) => u.username !== username));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro ao excluir");
    }
  };

  const alterarSenha = async (username: string) => {
    const nova = senhaEdit[username];
    if (!nova) return;
    setSalvandoSenha(username);
    try {
      await apiJson(`/usuarios/${username}/senha`, {
        method: "PATCH",
        body: JSON.stringify({ password: nova }),
      });
      setSenhaEdit((prev) => ({ ...prev, [username]: "" }));
      alert(`Senha de "${username}" alterada com sucesso.`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro ao alterar senha");
    } finally {
      setSalvandoSenha(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-500 mt-1">Crie e gerencie os acessos ao DRE App</p>
        </div>
        <button onClick={() => router.push("/")} className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
          Voltar
        </button>
      </div>

      {/* Criar usuário */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
          <h2 className="font-semibold text-blue-800 text-sm">Novo Usuário</h2>
        </div>
        <form onSubmit={criarUsuario} className="p-5 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Usuário</label>
            <input
              type="text"
              value={novoUsername}
              onChange={(e) => setNovoUsername(e.target.value)}
              placeholder="ex: cafecultura"
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Senha</label>
            <input
              type="text"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="senha123"
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
            />
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <input
              type="checkbox"
              id="is_admin"
              checked={novoAdmin}
              onChange={(e) => setNovoAdmin(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="is_admin" className="text-sm text-gray-600">Administrador</label>
          </div>
          {erroCriar && <p className="text-xs text-red-600 w-full">{erroCriar}</p>}
          <button
            type="submit"
            disabled={criando}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2 rounded-lg text-sm font-medium"
          >
            {criando ? "Criando..." : "Criar Usuário"}
          </button>
        </form>
      </div>

      {/* Lista de usuários */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800 text-sm">Usuários Cadastrados ({usuarios.length})</h2>
        </div>

        {carregando ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : erro ? (
          <div className="p-5 text-red-600 text-sm">{erro}</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {usuarios.map((u) => (
              <div key={u.id} className="px-5 py-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{u.username}</span>
                    {u.is_admin ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Usuário</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Criado em {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                {/* Alterar senha */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nova senha"
                    value={senhaEdit[u.username] || ""}
                    onChange={(e) => setSenhaEdit((prev) => ({ ...prev, [u.username]: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                  />
                  <button
                    onClick={() => alterarSenha(u.username)}
                    disabled={!senhaEdit[u.username] || salvandoSenha === u.username}
                    className="text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    {salvandoSenha === u.username ? "Salvando..." : "Alterar"}
                  </button>
                </div>

                <button
                  onClick={() => deletarUsuario(u.username)}
                  className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
