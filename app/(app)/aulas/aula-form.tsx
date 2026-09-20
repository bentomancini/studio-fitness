"use client";

import Link from "next/link";
import { useActionState } from "react";
import { DIAS_SEMANA, formatoHorario } from "@/lib/constantes";
import { createAula, updateAula } from "./actions";

type Aula = {
  id: string;
  tipo_aula: string;
  dia_semana: number;
  horario: string;
  limite_vagas: number;
};

export function AulaForm({ aula }: { aula?: Aula }) {
  const acao = aula ? updateAula.bind(null, aula.id) : createAula;
  const [state, formAction, pending] = useActionState(acao, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Tipo de aula *</span>
        <input
          type="text"
          name="tipo_aula"
          required
          maxLength={60}
          defaultValue={aula?.tipo_aula ?? ""}
          placeholder="Ex.: Musculação, Pilates, Cross..."
          className="h-12 rounded-xl border border-zinc-300 px-4 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Dia da semana</span>
        <select
          name="dia_semana"
          defaultValue={aula?.dia_semana ?? 1}
          className="h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base"
        >
          {DIAS_SEMANA.map((dia, i) => (
            <option key={dia} value={i}>
              {dia}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Horário *</span>
        <input
          type="time"
          name="horario"
          required
          defaultValue={aula ? formatoHorario(aula.horario) : ""}
          className="h-12 rounded-xl border border-zinc-300 px-4 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Limite de vagas *</span>
        <input
          type="number"
          name="limite_vagas"
          required
          min={1}
          max={99}
          defaultValue={aula?.limite_vagas ?? 10}
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

      <div className="mt-2 flex gap-3">
        <Link
          href="/aulas"
          className="flex min-h-12 flex-1 items-center justify-center rounded-xl border border-zinc-300 text-base font-medium text-zinc-700"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 flex-1 rounded-xl bg-zinc-900 text-base font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar aula"}
        </button>
      </div>
    </form>
  );
}