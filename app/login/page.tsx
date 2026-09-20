"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold">Studio Fitness</h1>
        <p className="mb-8 text-zinc-600">Entre para acessar a agenda.</p>

        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">E-mail</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              inputMode="email"
              className="h-12 rounded-xl border border-zinc-300 px-4 text-base"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Senha</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="h-12 rounded-xl border border-zinc-300 px-4 text-base"
            />
          </label>

          {state?.error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="h-12 rounded-xl bg-zinc-900 text-base font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}