"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createAluno, updateAluno } from "./actions";

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
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Nome *</span>
        <input
          type="text"
          name="nome"
          required
          maxLength={120}
          defaultValue={aluno?.nome ?? ""}
          className="h-12 rounded-xl border border-zinc-300 px-4 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Telefone / WhatsApp</span>
        <input
          type="tel"
          name="telefone"
          maxLength={30}
          defaultValue={aluno?.telefone ?? ""}
          className="h-12 rounded-xl border border-zinc-300 px-4 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Observações</span>
        <textarea
          name="observacoes"
          maxLength={2000}
          rows={4}
          defaultValue={aluno?.observacoes ?? ""}
          className="rounded-xl border border-zinc-300 px-4 py-3 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Status</span>
        <select
          name="status"
          defaultValue={aluno?.status ?? "ativo"}
          className="h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900"
        >
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </label>

      {state?.error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <div className="mt-2 flex gap-3">
        <Link
          href="/alunos"
          className="flex min-h-12 flex-1 items-center justify-center rounded-xl border border-zinc-300 text-base font-medium text-zinc-700"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 flex-1 rounded-xl bg-zinc-900 text-base font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar aluno"}
        </button>
      </div>
    </form>
  );
}