"use client";

import { useState } from "react";
import Link from "next/link";
import { alternarStatus } from "./actions";
import { BotaoExcluirAluno } from "./botao-excluir";
import { showToast } from "@/components/toast";
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Edit3,
  FileText,
  PowerOff,
  Power,
  Loader2,
} from "lucide-react";

type Aluno = {
  id: string;
  nome: string;
  telefone: string;
  status: "ativo" | "inativo";
  data_nascimento?: string | null;
  profissao?: string | null;
  tem_dores_cronicas?: boolean | null;
};

function extrairIniciais(nome: string) {
  const partes = nome.trim().split(" ");
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function AlunosClient({ alunos }: { alunos: Aluno[] }) {
  const [listaAlunos, setListaAlunos] = useState<Aluno[]>(alunos);
  const [alunosAnteriores, setAlunosAnteriores] = useState<Aluno[]>(alunos);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativo" | "inativo">("todos");

  // Sincroniza a lista se o servidor re-entrega dados atualizados
  if (alunos !== alunosAnteriores) {
    setAlunosAnteriores(alunos);
    setListaAlunos(alunos);
  }

  const handleAlternarStatusOtimista = (id: string, novoStatus: "ativo" | "inativo") => {
    setListaAlunos((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: novoStatus } : a))
    );
  };

  const handleExcluirOtimista = (id: string) => {
    setListaAlunos((prev) => prev.filter((a) => a.id !== id));
  };

  const filtrados = listaAlunos.filter((aluno) => {
    const combinaBusca =
      aluno.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (aluno.telefone && aluno.telefone.includes(busca));
    const combinaStatus =
      filtroStatus === "todos" ? true : aluno.status === filtroStatus;
    return combinaBusca && combinaStatus;
  });

  const totalAtivos = listaAlunos.filter((a) => a.status === "ativo").length;

  return (
    <div className="flex flex-col gap-5">
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Alunos</h1>
          <p className="text-xs text-zinc-400">
            {totalAtivos} de {alunos.length} alunos ativos
          </p>
        </div>
        <Link
          href="/alunos/novo"
          className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-3.5 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
        >
          <UserPlus className="h-4 w-4 stroke-[2.5]" />
          <span>Novo Aluno</span>
        </Link>
      </div>

      {/* Barra de Busca e Filtros */}
      {alunos.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar aluno por nome ou telefone..."
              className="h-11 w-full rounded-2xl border border-white/10 bg-zinc-900/80 pl-10 pr-4 text-xs text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
            />
          </div>

          {/* Filtro rápido por status em grid de 3 colunas */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setFiltroStatus("todos")}
              className={`flex h-8 items-center justify-center rounded-xl text-center text-[11px] font-semibold transition-all ${
                filtroStatus === "todos"
                  ? "bg-zinc-700 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Todos ({alunos.length})
            </button>
            <button
              onClick={() => setFiltroStatus("ativo")}
              className={`flex h-8 items-center justify-center rounded-xl text-center text-[11px] font-semibold transition-all ${
                filtroStatus === "ativo"
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Ativos ({totalAtivos})
            </button>
            <button
              onClick={() => setFiltroStatus("inativo")}
              className={`flex h-8 items-center justify-center rounded-xl text-center text-[11px] font-semibold transition-all ${
                filtroStatus === "inativo"
                  ? "bg-zinc-800 text-zinc-300 border border-white/10"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Inativos ({alunos.length - totalAtivos})
            </button>
          </div>
        </div>
      )}

      {/* Lista de Alunos */}
      {alunos.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-8 text-center">
          <Users className="mb-3 h-8 w-8 text-zinc-600 stroke-[1.5]" />
          <h3 className="text-sm font-semibold text-white">
            Nenhum aluno cadastrado
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Cadastre seu primeiro aluno para começar a gerenciar vagas e planos.
          </p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="glass-panel rounded-3xl p-6 text-center text-xs text-zinc-500">
          Nenhum aluno corresponde à busca &quot;{busca}&quot;.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtrados.map((aluno) => {
            const isAtivo = aluno.status === "ativo";
            const telLimpo = aluno.telefone ? aluno.telefone.replace(/\D/g, "") : "";
            const linkWhats =
              telLimpo.length >= 10
                ? `https://wa.me/55${telLimpo}`
                : undefined;

            return (
              <li
                key={aluno.id}
                className={`glass-panel interactive-card relative overflow-hidden rounded-3xl p-4 border transition-all ${
                  isAtivo
                    ? "border-white/10 hover:border-white/20"
                    : "border-white/5 bg-zinc-950/40 opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <Link
                    href={`/alunos/${aluno.id}`}
                    className="flex items-center gap-2.5 min-w-0 flex-1 group"
                  >
                    {/* Avatar com Iniciais */}
                    <div
                      className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-bold transition-transform group-hover:scale-105 ${
                        isAtivo
                          ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-zinc-950 shadow-md shadow-emerald-500/10"
                          : "bg-zinc-800 text-zinc-400 border border-white/5"
                      }`}
                    >
                      {extrairIniciais(aluno.nome)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-white tracking-tight truncate group-hover:text-emerald-300 transition-colors">
                          {aluno.nome}
                        </h3>
                        {aluno.tem_dores_cronicas && (
                          <span className="shrink-0 rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                            Dores
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                        {aluno.telefone ? (
                          <span className="flex items-center gap-1 truncate">
                            <Phone className="h-3 w-3 text-zinc-500 shrink-0" />
                            <span className="truncate">{aluno.telefone}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-600">Sem telefone</span>
                        )}
                        {aluno.profissao && (
                          <span className="text-zinc-500 truncate text-[11px]">
                            · {aluno.profissao}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Badge de status */}
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                      isAtivo
                        ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                        : "border-white/10 bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isAtivo ? "bg-emerald-400" : "bg-zinc-500"
                      }`}
                    />
                    {isAtivo ? "Ativo" : "Inativo"}
                  </span>
                </div>

                {/* Rodapé de Ações do Aluno - Sempre em 1 linha no mobile e desktop */}
                <div className="mt-3.5 flex items-center justify-between gap-1 border-t border-white/5 pt-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* Botão de WhatsApp Rápido se tiver telefone */}
                    {linkWhats && (
                      <a
                        href={linkWhats}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-press flex h-8 w-8 sm:w-auto items-center justify-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-0 sm:px-2.5 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20 shrink-0"
                        title="Conversar no WhatsApp"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden
                        >
                          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24s8.24 3.7 8.24 8.24-3.7 8.24-8.23 8.24m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28" />
                        </svg>
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    )}

                    <Link
                      href={`/alunos/${aluno.id}`}
                      className="btn-press flex h-8 items-center gap-1 rounded-xl border border-white/10 bg-zinc-900/80 px-2.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white shrink-0"
                    >
                      <FileText className="h-3 w-3 text-zinc-400 shrink-0" />
                      <span>Ficha</span>
                    </Link>

                    <Link
                      href={`/alunos/${aluno.id}/editar`}
                      className="btn-press flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white shrink-0"
                      title="Editar ficha"
                      aria-label="Editar ficha"
                    >
                      <Edit3 className="h-3.5 w-3.5 shrink-0" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-auto">
                    <BotaoAlternarStatusAluno
                      id={aluno.id}
                      status={aluno.status}
                      onAlternar={(novo) => handleAlternarStatusOtimista(aluno.id, novo)}
                    />
                    <BotaoExcluirAluno
                      id={aluno.id}
                      onExcluir={() => handleExcluirOtimista(aluno.id)}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function BotaoAlternarStatusAluno({
  id,
  status,
  onAlternar,
}: {
  id: string;
  status: "ativo" | "inativo";
  onAlternar?: (novo: "ativo" | "inativo") => void;
}) {
  const [pending, setPending] = useState(false);
  const isAtivo = status === "ativo";

  const handleAlternar = async () => {
    const novoStatus: "ativo" | "inativo" = isAtivo ? "inativo" : "ativo";

    // 1) Feedback tátil imediato no celular
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }

    // 2) Reação visual instantânea (0ms delay)
    if (onAlternar) {
      onAlternar(novoStatus);
    }

    showToast(
      isAtivo ? "Aluno inativado." : "Aluno ativado com sucesso!",
      "success"
    );

    setPending(true);
    try {
      await alternarStatus(id, status);
    } catch {
      // Se falhar na rede, desfaz
      if (onAlternar) {
        onAlternar(status);
      }
      showToast("Erro ao alterar status.", "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleAlternar}
      className={`btn-press flex h-8 shrink-0 items-center gap-1 rounded-xl px-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
        isAtivo
          ? "text-zinc-400 hover:text-amber-400 active:scale-90"
          : "text-emerald-400 hover:text-emerald-300 active:scale-90"
      }`}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isAtivo ? (
        <>
          <PowerOff className="h-3.5 w-3.5" />
          <span>Inativar</span>
        </>
      ) : (
        <>
          <Power className="h-3.5 w-3.5" />
          <span>Ativar</span>
        </>
      )}
    </button>
  );
}
