"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { Dumbbell, Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-12">
      {/* Luz ambiente sutil no topo */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-emerald-600/10 blur-[100px]"
        aria-hidden
      />

      <div className="relative w-full max-w-sm">
        {/* Cartão principal com efeito glassmorphism */}
        <div className="glass-panel-elevated rounded-3xl p-7 shadow-2xl shadow-black/80">
          {/* Logo e cabeçalho */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/25">
              <Dumbbell className="h-8 w-8 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Studio Brenno Mancini
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Gerenciamento exclusivo do estúdio
            </p>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                E-mail
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder="usuario@gmail.com"
                  className="h-12 w-full rounded-xl border border-white/10 bg-zinc-900/90 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Senha
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-12 w-full rounded-xl border border-white/10 bg-zinc-900/90 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                />
              </div>
            </label>

            {state?.error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300"
              >
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/25 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              {pending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Acessando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Rodapé discreto */}
        <p className="mt-6 text-center text-xs text-zinc-600">
          Acesso restrito ao proprietário · Studio Brenno Mancini
        </p>
      </div>
    </main>
  );
}