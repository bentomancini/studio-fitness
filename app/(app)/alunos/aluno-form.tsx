"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createAluno, updateAluno } from "./actions";
import {
  User,
  Phone,
  FileText,
  ShieldCheck,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

type Aluno = {
  id: string;
  nome: string;
  telefone: string;
  observacoes: string;
  status: "ativo" | "inativo";
};

export function AlunoForm({ aluno }: { aluno?: Aluno }) {
  const acao = aluno ? updateAluno.bind(null, aluno.id) : createAluno;
  const [state, formAction, pending] = useActionState(acao, {});

  return (
    <form action={formAction} className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <User className="h-3.5 w-3.5 text-emerald-400" />
          Nome Completo *
        </span>
        <input
          type="text"
          name="nome"
          required
          maxLength={120}
          defaultValue={aluno?.nome ?? ""}
          placeholder="Ex: João da Silva"
          className="h-12 rounded-xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Phone className="h-3.5 w-3.5 text-emerald-400" />
          Telefone / WhatsApp
        </span>
        <input
          type="tel"
          name="telefone"
          maxLength={30}
          defaultValue={aluno?.telefone ?? ""}
          placeholder="Ex: (11) 98765-4321"
          className="h-12 rounded-xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <FileText className="h-3.5 w-3.5 text-emerald-400" />
          Observações / Restrições Médicas
        </span>
        <textarea
          name="observacoes"
          maxLength={2000}
          rows={3}
          defaultValue={aluno?.observacoes ?? ""}
          placeholder="Ex: Histórico de lesão, metas de treino, etc."
          className="rounded-xl border border-white/10 bg-zinc-900/90 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors resize-none"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Status no Estúdio
        </span>
        <select
          name="status"
          defaultValue={aluno?.status ?? "ativo"}
          className="h-12 rounded-xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
        >
          <option value="ativo" className="bg-zinc-900 text-white">
            Ativo (pode agendar aulas)
          </option>
          <option value="inativo" className="bg-zinc-900 text-white">
            Inativo (pausado / trancado)
          </option>
        </select>
      </label>

      {state?.error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-xs text-red-300"
        >
          <AlertCircle className="h-4 w-4" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="mt-2 flex gap-3">
        <Link
          href="/alunos"
          className="btn-press flex h-12 flex-1 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="btn-press flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>{aluno ? "Salvar alterações" : "Cadastrar aluno"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}