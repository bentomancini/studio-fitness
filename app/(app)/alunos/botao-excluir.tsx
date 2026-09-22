"use client";

import { useState } from "react";
import { removerAlunoAction } from "./actions";
import { showToast } from "@/components/toast";
import { Trash2, Check, X, Loader2 } from "lucide-react";

export function BotaoExcluirAluno({
  id,
  onExcluir,
}: {
  id: string;
  onExcluir?: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [pending, setPending] = useState(false);

  const executarExclusao = async () => {
    setPending(true);
    setConfirmando(false);
    if (onExcluir) {
      onExcluir();
    }
    try {
      await removerAlunoAction(id);
      showToast("Aluno excluído com sucesso!", "success");
    } catch {
      showToast("Erro ao excluir aluno.", "error");
    } finally {
      setPending(false);
    }
  };

  if (confirmando) {
    return (
      <div className="flex items-center gap-1 rounded-xl border border-red-500/40 bg-red-950/80 p-0.5 shrink-0 animate-in fade-in duration-150">
        <span className="hidden sm:inline px-1 text-[10px] font-bold text-red-300">
          Excluir?
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={executarExclusao}
          className="btn-press flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
          aria-label="Confirmar exclusão"
          title="Confirmar exclusão"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          )}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmando(false)}
          className="btn-press flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-zinc-400 hover:text-white"
          aria-label="Cancelar exclusão"
          title="Cancelar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      aria-label="Excluir aluno"
      title="Excluir aluno"
      className="btn-press flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-transparent text-zinc-500 transition-colors hover:border-red-500/30 hover:bg-red-950/30 hover:text-red-400 active:scale-90"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}