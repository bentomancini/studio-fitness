"use client";

import { useState } from "react";
import { alternarAtiva } from "./actions";
import { showToast } from "@/components/toast";
import { Power, PowerOff, Loader2 } from "lucide-react";

export function BotaoAlternarAula({
  id,
  ativa,
}: {
  id: string;
  ativa: boolean;
}) {
  const [pending, setPending] = useState(false);

  const handleAlternar = async () => {
    setPending(true);
    try {
      await alternarAtiva(id, ativa);
      showToast(
        ativa ? "Aula inativada." : "Aula ativada com sucesso!",
        "success"
      );
    } catch {
      showToast("Erro ao alterar status da aula.", "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleAlternar}
      className={`btn-press flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
        ativa
          ? "text-zinc-400 hover:text-amber-400 active:scale-90"
          : "text-emerald-400 hover:text-emerald-300 active:scale-90"
      }`}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : ativa ? (
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
