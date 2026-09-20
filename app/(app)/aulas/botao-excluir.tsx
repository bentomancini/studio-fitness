"use client";

import { removerAulaAction } from "./actions";

export function BotaoExcluirAula({ id }: { id: string }) {
  return (
    <form
      action={removerAulaAction.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("Excluir esta aula/horário?")) {
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