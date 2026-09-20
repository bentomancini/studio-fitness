"use client";

import { removerAlunoAction } from "./actions";

export function BotaoExcluirAluno({ id }: { id: string }) {
  return (
    <form
      action={removerAlunoAction.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("Excluir este aluno? Os agendamentos dele serão apagados.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="min-h-11 rounded-xl px-4 text-sm font-medium text-red-600"
      >
        Excluir
      </button>
    </form>
  );
}