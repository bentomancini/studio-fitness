"use client";

import Link from "next/link";
import { useActionState } from "react";
import { DIAS_SEMANA, formatoHorario } from "@/lib/constantes";
import { createAula, updateAula } from "./actions";
import {
  Dumbbell,
  Calendar,
  Clock,
  Users,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

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
    <form
      action={formAction}
      className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
          Modalidade / Tipo de aula *
        </span>
        <input
          type="text"
          name="tipo_aula"
          required
          maxLength={60}
          defaultValue={aula?.tipo_aula ?? ""}
          placeholder="Ex.: Musculação, Pilates, Treino Funcional..."
          className="h-12 rounded-xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Calendar className="h-3.5 w-3.5 text-emerald-400" />
          Dia da Semana *
        </span>
        <select
          name="dia_semana"
          defaultValue={aula ? aula.dia_semana : ""}
          required
          className="h-12 rounded-xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
        >
          <option value="" disabled className="bg-zinc-900 text-zinc-500">
            Selecione o dia da semana
          </option>
          {DIAS_SEMANA.map((dia, i) => (
            <option key={dia} value={i} className="bg-zinc-900 text-white">
              {dia}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <Clock className="h-3.5 w-3.5 text-emerald-400" />
            Horário *
          </span>
          <input
            type="time"
            name="horario"
            required
            defaultValue={aula ? formatoHorario(aula.horario) : "07:00"}
            className="h-12 rounded-xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            Capacidade *
          </span>
          <input
            type="number"
            name="limite_vagas"
            required
            min={1}
            max={99}
            defaultValue={aula?.limite_vagas ?? 10}
            className="h-12 rounded-xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
          />
        </label>
      </div>

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
          href="/aulas"
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
              <span>{aula ? "Salvar alterações" : "Cadastrar horário"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}