"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  dataHoje,
  diaDaSemana,
  formatarData,
  formatoHorario,
} from "@/lib/constantes";
import { agendarAula, cancelarAgendamento, EstadoAcao } from "./actions";

type Aula = {
  id: string;
  tipo_aula: string;
  dia_semana: number;
  horario: string;
  limite_vagas: number;
};

type Aluno = { id: string; nome: string; telefone: string };

type Agendamento = { aula_id: string; aluno_id: string; data: string };

type Suspensao = { aula_id: string; data: string };

export function Agendamento({ alunos, aulas, agendamentos, suspensoes }: {
  alunos: Aluno[];
  aulas: Aula[];
  agendamentos: Agendamento[];
  suspensoes: Suspensao[];
}) {
  const [alunoId, setAlunoId] = useState(alunos[0]?.id ?? "");
  const [data, setData] = useState(dataHoje());

  const weekday = diaDaSemana(data);
  const doDia = aulas
    .filter((a) => a.dia_semana === weekday)
    .sort((a, b) => a.horario.localeCompare(b.horario));

  if (alunos.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-xl bg-zinc-50 px-4 py-6 text-center text-zinc-600">
          Cadastre um aluno ativo para começar a agendar.
        </p>
        <Link
          href="/alunos/novo"
          className="flex min-h-12 items-center justify-center rounded-xl bg-zinc-900 text-base font-semibold text-white"
        >
          Cadastrar aluno
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Aluno</span>
          <select
            value={alunoId}
            onChange={(e) => setAlunoId(e.target.value)}
            className="h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900"
          >
            {alunos.map((a) => (
              <option key={a.id} value={a.id} className="text-zinc-900">
                {a.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Data *</span>
          <input
            type="date"
            value={data}
            min={dataHoje()}
            onChange={(e) => setData(e.target.value)}
            className="h-12 rounded-xl border border-zinc-300 px-4 text-base"
          />
        </label>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Aulas de {formatarData(data)}
        </h2>

        {doDia.length === 0 ? (
          <p className="rounded-xl bg-zinc-50 px-4 py-6 text-center text-zinc-600">
            Não há aulas neste dia.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {doDia.map((aula) => {
              const ocupadas = agendamentos.filter(
                (g) => g.aula_id === aula.id && g.data === data
              ).length;
              const suspensa = suspensoes.some(
                (s) => s.aula_id === aula.id && s.data === data
              );
              const agendado = agendamentos.some(
                (g) =>
                  g.aula_id === aula.id &&
                  g.aluno_id === alunoId &&
                  g.data === data
              );
              const lotada = ocupadas >= aula.limite_vagas;

              return (
                <li key={aula.id} className="rounded-xl border border-zinc-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{aula.tipo_aula}</p>
                      <p className="text-sm text-zinc-600">
                        {formatoHorario(aula.horario)} · {ocupadas}/
                        {aula.limite_vagas} vagas
                      </p>
                    </div>
                    <span
                      className={
                        suspensa
                          ? "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                          : lotada
                            ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700"
                            : "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                      }
                    >
                      {suspensa ? "Suspensa" : lotada ? "Lotada" : "Disponível"}
                    </span>
                  </div>

                  <div className="mt-3 border-t border-zinc-100 pt-3">
                    {agendado ? (
                      <AcaoCancelar aulaId={aula.id} alunoId={alunoId} data={data} />
                    ) : suspensa || lotada ? (
                      <p className="flex min-h-11 items-center text-sm text-zinc-500">
                        {suspensa
                          ? "Aula suspensa nesta data."
                          : "Aula lotada, sem vagas."}
                      </p>
                    ) : (
                      <AcaoAgendar aulaId={aula.id} alunoId={alunoId} data={data} />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function AcaoAgendar({ aulaId, alunoId, data }: {
  aulaId: string;
  alunoId: string;
  data: string;
}) {
  const [state, formAction, pending] = useActionState<EstadoAcao, FormData>(
    agendarAula.bind(null, aulaId, alunoId, data),
    {}
  );

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Agendando..." : "Agendar"}
        </button>
      </form>
      {state?.ok && (
        <p className="text-sm font-medium text-green-700">Agendado com sucesso.</p>
      )}
      {state?.error && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
    </div>
  );
}

function AcaoCancelar({ aulaId, alunoId, data }: {
  aulaId: string;
  alunoId: string;
  data: string;
}) {
  const [state, formAction, pending] = useActionState<EstadoAcao, FormData>(
    cancelarAgendamento.bind(null, aulaId, alunoId, data),
    {}
  );

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-xl border border-red-200 px-4 text-sm font-medium text-red-600 disabled:opacity-50"
        >
          {pending ? "Cancelando..." : "Cancelar agendamento"}
        </button>
      </form>
      {state?.ok && (
        <p className="text-sm font-medium text-green-700">Agendamento cancelado.</p>
      )}
      {state?.error && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
    </div>
  );
}