"use client";

import { useActionState, useState } from "react";
import {
  dataHoje,
  diaDaSemana,
  formatarData,
  formatoHorario,
} from "@/lib/constantes";
import { alternarSuspensao, EstadoSuspensao } from "./actions";

type Aula = {
  id: string;
  tipo_aula: string;
  dia_semana: number;
  horario: string;
  limite_vagas: number;
};

type Aluno = { id: string; nome: string };

type Agendamento = { aula_id: string; aluno_id: string; data: string };

type Suspensao = { aula_id: string; data: string };

const NOMES_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

function adicionarDias(data: string, dias: number) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const dt = new Date(ano, mes - 1, dia + dias);
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${m}-${d}`;
}

function inicioDaSemana(data: string) {
  return adicionarDias(data, -diaDaSemana(data));
}

export function Agenda({ aulas, alunos, agendamentos, suspensoes }: {
  aulas: Aula[];
  alunos: Aluno[];
  agendamentos: Agendamento[];
  suspensoes: Suspensao[];
}) {
  const [aba, setAba] = useState<"dia" | "semana">("dia");
  const [data, setData] = useState(dataHoje());

  const nomesDaAula = (aulaId: string, d: string) =>
    agendamentos
      .filter((g) => g.aula_id === aulaId && g.data === d)
      .map((g) => alunos.find((a) => a.id === g.aluno_id)?.nome ?? "?");

  const ocupadas = (aulaId: string, d: string) =>
    agendamentos.filter((g) => g.aula_id === aulaId && g.data === d).length;

  const suspensaEm = (aulaId: string, d: string) =>
    suspensoes.some((s) => s.aula_id === aulaId && s.data === d);

  const aulasDoDia = aulas
    .filter((a) => a.dia_semana === diaDaSemana(data))
    .sort((a, b) => a.horario.localeCompare(b.horario));

  const domingo = inicioDaSemana(data);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
        <button
          onClick={() => setAba("dia")}
          className={
            aba === "dia"
              ? "min-h-11 flex-1 rounded-lg bg-white text-sm font-semibold text-zinc-900 shadow-sm"
              : "min-h-11 flex-1 rounded-lg text-sm font-medium text-zinc-500"
          }
        >
          Dia
        </button>
        <button
          onClick={() => setAba("semana")}
          className={
            aba === "semana"
              ? "min-h-11 flex-1 rounded-lg bg-white text-sm font-semibold text-zinc-900 shadow-sm"
              : "min-h-11 flex-1 rounded-lg text-sm font-medium text-zinc-500"
          }
        >
          Semana
        </button>
      </div>

      {aba === "dia" ? (
        <Dia
          data={data}
          setData={setData}
          aulas={aulasDoDia}
          nomesDaAula={nomesDaAula}
          ocupadas={ocupadas}
          suspensaEm={suspensaEm}
        />
      ) : (
        <Semana
          domingo={domingo}
          setData={setData}
          setAba={setAba}
          aulas={aulas}
          ocupadas={ocupadas}
          suspensaEm={suspensaEm}
        />
      )}
    </div>
  );
}

function Dia({ data, setData, aulas, nomesDaAula, ocupadas, suspensaEm }: {
  data: string;
  setData: (d: string) => void;
  aulas: Aula[];
  nomesDaAula: (aulaId: string, d: string) => string[];
  ocupadas: (aulaId: string, d: string) => number;
  suspensaEm: (aulaId: string, d: string) => boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setData(adicionarDias(data, -1))}
          aria-label="Dia anterior"
          className="flex min-h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 text-xl text-zinc-700"
        >
          ‹
        </button>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="min-h-12 flex-1 rounded-xl border border-zinc-300 px-4 text-center text-base"
        />
        <button
          onClick={() => setData(adicionarDias(data, 1))}
          aria-label="Próximo dia"
          className="flex min-h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 text-xl text-zinc-700"
        >
          ›
        </button>
      </div>

      {aulas.length === 0 ? (
        <p className="rounded-xl bg-zinc-50 px-4 py-6 text-center text-zinc-600">
          Não há aulas neste dia.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {aulas.map((aula) => {
            const nomes = nomesDaAula(aula.id, data);
            const suspensa = suspensaEm(aula.id, data);
            const cheia = ocupadas(aula.id, data) >= aula.limite_vagas;

            return (
              <li key={aula.id} className="rounded-xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{aula.tipo_aula}</p>
                    <p className="text-sm text-zinc-600">
                      {formatoHorario(aula.horario)} · {ocupadas(aula.id, data)}/
                      {aula.limite_vagas} vagas
                    </p>
                  </div>
                  <span
                    className={
                      suspensa
                        ? "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                        : cheia
                          ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700"
                          : "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                    }
                  >
                    {suspensa ? "Suspensa" : cheia ? "Cheia" : "Confirmada"}
                  </span>
                </div>

                {nomes.length === 0 ? (
                  <p className="mt-3 border-t border-zinc-100 pt-3 text-sm text-zinc-500">
                    Nenhum aluno agendado.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
                    {nomes.map((nome, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-800"
                      >
                        {nome}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 border-t border-zinc-100 pt-2">
                  <AcaoSuspender aulaId={aula.id} data={data} suspensa={suspensa} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Semana({ domingo, setData, setAba, aulas, ocupadas, suspensaEm }: {
  domingo: string;
  setData: (d: string) => void;
  setAba: (a: "dia" | "semana") => void;
  aulas: Aula[];
  ocupadas: (aulaId: string, d: string) => number;
  suspensaEm: (aulaId: string, d: string) => boolean;
}) {
  const dias = Array.from({ length: 7 }, (_, i) => adicionarDias(domingo, i));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setData(adicionarDias(domingo, -7))}
          aria-label="Semana anterior"
          className="flex min-h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 text-xl text-zinc-700"
        >
          ‹
        </button>
        <p className="min-h-11 flex-1 text-center text-sm font-medium text-zinc-700">
          {formatarData(dias[0])} – {formatarData(dias[6])}
        </p>
        <button
          onClick={() => setData(adicionarDias(domingo, 7))}
          aria-label="Próxima semana"
          className="flex min-h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 text-xl text-zinc-700"
        >
          ›
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {dias.map((dia) => {
          const doDia = aulas
            .filter((a) => a.dia_semana === diaDaSemana(dia))
            .sort((a, b) => a.horario.localeCompare(b.horario));

          return (
            <li key={dia}>
              <button
                onClick={() => {
                  setData(dia);
                  setAba("dia");
                }}
                className="flex w-full flex-col gap-2 rounded-xl border border-zinc-200 p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {NOMES_SEMANA[diaDaSemana(dia)]}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {formatarData(dia)}
                  </span>
                </div>
                {doDia.length === 0 ? (
                  <p className="text-sm text-zinc-500">Sem aulas.</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {doDia.map((aula) => {
                      const suspensa = suspensaEm(aula.id, dia);
                      return (
                        <p key={aula.id} className="text-sm text-zinc-700">
                          {formatoHorario(aula.horario)} · {aula.tipo_aula} ·{" "}
                          {ocupadas(aula.id, dia)}/{aula.limite_vagas}
                          {suspensa && <span className="text-red-600"> · suspensa</span>}
                        </p>
                      );
                    })}
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AcaoSuspender({ aulaId, data, suspensa }: {
  aulaId: string;
  data: string;
  suspensa: boolean;
}) {
  const [state, formAction, pending] = useActionState<EstadoSuspensao, FormData>(
    alternarSuspensao.bind(null, aulaId, data, suspensa),
    {}
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!suspensa && !confirm("Suspender esta aula neste dia?")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className={
          suspensa
            ? "min-h-11 rounded-xl px-2 text-sm font-medium text-blue-700 disabled:opacity-50"
            : "min-h-11 rounded-xl px-2 text-sm font-medium text-red-600 disabled:opacity-50"
        }
      >
        {pending
          ? "Salvando..."
          : suspensa
            ? "Reativar aula neste dia"
            : "Suspender neste dia"}
      </button>
      {state?.error && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}