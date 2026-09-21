"use client";

import { Sparkles } from "lucide-react";

export function CopilotoHeaderButton() {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("abrir-copiloto"));
      }}
      className="flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-950/50 px-2.5 py-1.5 text-xs font-semibold text-violet-300 shadow-sm transition-all hover:border-violet-400/50 hover:bg-violet-900/60 hover:text-white active:scale-95 sm:px-3"
      aria-label="Abrir Copiloto IA"
      title="Abrir Copiloto IA do Studio"
    >
      <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
      <span className="text-xs">Copiloto</span>
      <span className="hidden sm:inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
    </button>
  );
}
