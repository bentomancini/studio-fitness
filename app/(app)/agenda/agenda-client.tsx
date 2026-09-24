"use client";

import { useActionState, useState, useRef, useMemo } from "react";
import {
  dataHoje,
  diaDaSemana,
  formatarData,
  formatoHorario,
} from "@/lib/constantes";
import { alternarSuspensao, EstadoSuspensao } from "./actions";
import { montarLembreteWhatsApp } from "@/lib/lembrete";
import { showToast } from "@/components/toast";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Users,
  AlertCircle,
  RotateCcw,
  Loader2,
} from "lucide-react";

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

function extrairIniciais(nome: string) {
  const partes = nome.trim().split(" ");
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function formatarDataMobile(data: string, hoje: string) {
  const [, mes, dia] = data.split("-").map(Number);
  const nomesSemanaCurto = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const nomesMesCurto = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];
  const diaSemanaIdx = diaDaSemana(data);
  const dNum = String(dia).padStart(2, "0");

  if (data === hoje) {
    return `Hoje · ${nomesSemanaCurto[diaSemanaIdx]}, ${dNum} ${nomesMesCurto[mes - 1]}`;
  }
  const ontem = adicionarDias(hoje, -1);
  if (data === ontem) {
    return `Ontem · ${nomesSemanaCurto[diaSemanaIdx]}, ${dNum} ${nomesMesCurto[mes - 1]}`;
  }
  const amanha = adicionarDias(hoje, 1);
  if (data === amanha) {
    return `Amanhã · ${nomesSemanaCurto[diaSemanaIdx]}, ${dNum} ${nomesMesCurto[mes - 1]}`;
  }
  return `${nomesSemanaCurto[diaSemanaIdx]}, ${dNum} de ${nomesMesCurto[mes - 1]}`;
}

export function Agenda({
  aulas,
  alunos,
  agendamentos,
  suspensoes,
}: {
  aulas: Aula[];
  alunos: Aluno[];
  agendamentos: Agendamento[];
  suspensoes: Suspensao[];
}) {
  const [aba, setAba] = useState<"dia" | "semana">("dia");
  const [data, setData] = useState(dataHoje());

  // Índices compartilhados pelas visões de dia e semana: não percorre todos os
  // agendamentos para cada cartão, especialmente ao trocar de data no celular.
  const agendamentosPorAulaData = useMemo(() => {
    const alunosPorId = new Map(alunos.map((aluno) => [aluno.id, aluno]));
    const indice = new Map<string, { alunoId: string; nome: string; telefone: string }[]>();
    for (const agendamento of agendamentos) {
      const chave = `${agendamento.aula_id}:${agendamento.data}`;
      const lista = indice.get(chave) ?? [];
      const aluno = alunosPorId.get(agendamento.aluno_id);
      lista.push({
        alunoId: agendamento.aluno_id,
        nome: aluno?.nome ?? "?",
        telefone: aluno?.telefone ?? "",
      });
      indice.set(chave, lista);
    }
    return indice;
  }, [agendamentos, alunos]);

  const suspensoesPorAulaData = useMemo(
    () => new Set(suspensoes.map((s) => `${s.aula_id}:${s.data}`)),
    [suspensoes]
  );

  const agendados = (aulaId: string, d: string) =>
    agendamentosPorAulaData.get(`${aulaId}:${d}`) ?? [];

  const ocupadas = (aulaId: string, d: string) =>
    agendamentosPorAulaData.get(`${aulaId}:${d}`)?.length ?? 0;

  const suspensaEm = (aulaId: string, d: string) =>
    suspensoesPorAulaData.has(`${aulaId}:${d}`);

  const aulasDoDia = aulas
    .filter((a) => a.dia_semana === diaDaSemana(data))
    .sort((a, b) => a.horario.localeCompare(b.horario));

  const domingo = inicioDaSemana(data);

  return (
    <div className="flex flex-col gap-4">
      {/* Segmented Control iOS Moderno */}
      <div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-zinc-900/90 p-1">
        <button
          type="button"
          onClick={() => setAba("dia")}
          className={`btn-press flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
            aba === "dia"
              ? "bg-zinc-800 text-white shadow-md shadow-black/50"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Clock className="h-4 w-4" />
          Visão do Dia
        </button>
        <button
          type="button"
          onClick={() => setAba("semana")}
          className={`btn-press flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
            aba === "semana"
              ? "bg-zinc-800 text-white shadow-md shadow-black/50"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Visão da Semana
        </button>
      </div>

      {aba === "dia" ? (
        <Dia
          data={data}
          setData={setData}
          aulas={aulasDoDia}
          agendados={agendados}
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

function Dia({
  data,
  setData,
  aulas,
  agendados,
  ocupadas,
  suspensaEm,
}: {
  data: string;
  setData: (d: string) => void;
  aulas: Aula[];
  agendados: (
    aulaId: string,
    d: string
  ) => { alunoId: string; nome: string; telefone: string }[];
  ocupadas: (aulaId: string, d: string) => number;
  suspensaEm: (aulaId: string, d: string) => boolean;
}) {
  const hoje = dataHoje();
  const ontem = adicionarDias(hoje, -1);
  const amanha = adicionarDias(hoje, 1);
  const inputRef = useRef<HTMLInputElement>(null);

  const abrirSeletorData = () => {
    const el = inputRef.current;
    if (!el) return;
    try {
      const picker = (el as unknown as { showPicker?: () => void }).showPicker;
      if (typeof picker === "function") {
        picker.call(el);
      } else {
        el.focus();
      }
    } catch {
      el.focus();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Navegação de Data — Acessível, rápida e sem sobreposição */}
      <div className="glass-panel flex flex-col gap-2 rounded-2xl p-2.5 border border-white/10 shadow-lg shadow-black/40">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              const nova = adicionarDias(data, -1);
              setData(nova);
            }}
            aria-label="Dia anterior"
            className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:scale-90 transition-all border border-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Seletor central de data com clique direto acessível */}
          <div className="relative flex min-h-11 flex-1 items-center justify-center rounded-xl bg-zinc-900/90 px-3 border border-white/10 hover:border-emerald-500/40 transition-colors">
            <input
              ref={inputRef}
              type="date"
              value={data}
              onChange={(e) => {
                if (e.target.value) {
                  setData(e.target.value);
                  showToast(`Data alterada para ${formatarData(e.target.value)}`, "info");
                }
              }}
              className="absolute inset-0 z-20 h-full w-full opacity-0 cursor-pointer"
              aria-label="Selecionar data no calendário"
            />
            <button
              type="button"
              onClick={abrirSeletorData}
              className="btn-press flex items-center gap-2 text-center"
            >
              <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
                {formatarDataMobile(data, hoje)}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const nova = adicionarDias(data, 1);
              setData(nova);
            }}
            aria-label="Próximo dia"
            className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:scale-90 transition-all border border-white/10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Atalhos Rápidos com feedback tátil */}
        <div className="grid grid-cols-3 gap-1.5 border-t border-white/5 pt-2">
          <button
            type="button"
            onClick={() => setData(ontem)}
            className={`btn-press flex min-h-[38px] items-center justify-center rounded-xl text-xs font-semibold transition-all ${
              data === ontem
                ? "bg-zinc-700 text-white shadow-sm ring-1 ring-white/20"
                : "border border-white/5 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Ontem
          </button>
          <button
            type="button"
            onClick={() => setData(hoje)}
            className={`btn-press flex min-h-[38px] items-center justify-center rounded-xl text-xs font-bold transition-all ${
              data === hoje
                ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                : "border border-white/10 bg-zinc-800/80 text-emerald-400 hover:bg-zinc-800"
            }`}
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => setData(amanha)}
            className={`btn-press flex min-h-[38px] items-center justify-center rounded-xl text-xs font-semibold transition-all ${
              data === amanha
                ? "bg-zinc-700 text-white shadow-sm ring-1 ring-white/20"
                : "border border-white/5 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Amanhã
          </button>
        </div>
      </div>

      {/* Lista de Aulas */}
      {aulas.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-500 border border-white/5">
            <Calendar className="h-6 w-6 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">
            Nenhuma aula programada
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Não há horários cadastrados para {NOMES_SEMANA[diaDaSemana(data)]}.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {aulas.map((aula) => {
            const agendadosLista = agendados(aula.id, data);
            const suspensa = suspensaEm(aula.id, data);
            const qtdOcupadas = ocupadas(aula.id, data);
            const cheia = qtdOcupadas >= aula.limite_vagas;
            const porcentagem = Math.min(
              100,
              Math.round((qtdOcupadas / aula.limite_vagas) * 100)
            );

            return (
              <li
                key={aula.id}
                className={`glass-panel interactive-card relative overflow-hidden rounded-3xl p-4 border transition-all ${
                  suspensa
                    ? "border-red-500/25 bg-red-950/15"
                    : cheia
                    ? "border-amber-500/25"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                {/* Linha Superior: Horário, Nome da Aula e Badge de Status */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="shrink-0 flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatoHorario(aula.horario)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold tracking-tight text-white truncate">
                        {aula.tipo_aula}
                      </h3>
                    </div>
                  </div>

                  {/* Badge de Status */}
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                      suspensa
                        ? "border-red-500/30 bg-red-500/15 text-red-300"
                        : cheia
                        ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
                        : "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        suspensa
                          ? "bg-red-400"
                          : cheia
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                    />
                    {suspensa ? "Suspensa" : cheia ? "Lotada" : "Confirmada"}
                  </span>
                </div>

                {/* Barra de Ocupação de Vagas */}
                <div className="mt-3.5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-zinc-500" />
                      {qtdOcupadas} de {aula.limite_vagas} vagas ocupadas
                    </span>
                    <span className="font-medium text-zinc-500">
                      {porcentagem}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        suspensa
                          ? "bg-red-500/50"
                          : cheia
                          ? "bg-amber-400"
                          : "bg-gradient-to-r from-emerald-500 to-emerald-400"
                      }`}
                      style={{ width: `${porcentagem}%` }}
                    />
                  </div>
                </div>

                {/* Lista de Alunos Agendados */}
                {agendadosLista.length === 0 ? (
                  <p className="mt-3 border-t border-white/5 pt-3 text-xs text-zinc-500">
                    Nenhum aluno agendado neste horário.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
                    {agendadosLista.map((aluno) => {
                      const link = montarLembreteWhatsApp({
                        nome: aluno.nome,
                        telefone: aluno.telefone,
                        tipoAula: aula.tipo_aula,
                        horario: aula.horario,
                        data,
                      });

                      return (
                        <div
                          key={aluno.alunoId}
                          className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-zinc-900/90 py-1 pl-1.5 pr-2 shadow-sm max-w-full"
                        >
                          {/* Avatar Circular com Iniciais */}
                          <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-[10px] font-bold text-zinc-950">
                            {extrairIniciais(aluno.nome)}
                          </div>

                          <span className="text-xs font-medium text-zinc-200 truncate max-w-[130px] sm:max-w-[180px]">
                            {aluno.nome}
                          </span>

                          {link && (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Lembrar ${aluno.nome} no WhatsApp`}
                              className="btn-press shrink-0 ml-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-zinc-950 transition-all hover:bg-emerald-400 active:scale-90"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-4 w-4"
                                aria-hidden
                              >
                                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24s8.24 3.7 8.24 8.24-3.7 8.24-8.23 8.24m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28" />
                              </svg>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Ações da Aula (Suspender / Reativar) com Confirmação Inline */}
                <div className="mt-3.5 flex items-center justify-end border-t border-white/5 pt-2.5">
                  <AcaoSuspender
                    aulaId={aula.id}
                    data={data}
                    suspensa={suspensa}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Semana({
  domingo,
  setData,
  setAba,
  aulas,
  ocupadas,
  suspensaEm,
}: {
  domingo: string;
  setData: (d: string) => void;
  setAba: (a: "dia" | "semana") => void;
  aulas: Aula[];
  ocupadas: (aulaId: string, d: string) => number;
  suspensaEm: (aulaId: string, d: string) => boolean;
}) {
  const dias = Array.from({ length: 7 }, (_, i) => adicionarDias(domingo, i));
  const hoje = dataHoje();

  return (
    <div className="flex flex-col gap-4">
      {/* Navegador da semana */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setData(adicionarDias(domingo, -7))}
          aria-label="Semana anterior"
          className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-zinc-300 transition-colors hover:bg-zinc-800 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <p className="flex-1 text-center text-xs font-semibold text-zinc-300 truncate">
          {formatarData(dias[0])} – {formatarData(dias[6])}
        </p>

        <button
          type="button"
          onClick={() => setData(adicionarDias(domingo, 7))}
          aria-label="Próxima semana"
          className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-zinc-300 transition-colors hover:bg-zinc-800 active:scale-95"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {dias.map((dia) => {
          const diaSemanaIndex = diaDaSemana(dia);
          const doDia = aulas
            .filter((a) => a.dia_semana === diaSemanaIndex)
            .sort((a, b) => a.horario.localeCompare(b.horario));
          const isHoje = dia === hoje;

          return (
            <li key={dia}>
              <button
                type="button"
                onClick={() => {
                  setData(dia);
                  setAba("dia");
                }}
                className={`btn-press glass-panel interactive-card flex w-full flex-col gap-2.5 rounded-3xl p-4 text-left border transition-all ${
                  isHoje
                    ? "border-emerald-500/40 bg-zinc-900/90 shadow-md shadow-emerald-500/5"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {NOMES_SEMANA[diaSemanaIndex]}
                    </span>
                    {isHoje && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        Hoje
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400">
                    {formatarData(dia)}
                  </span>
                </div>

                {doDia.length === 0 ? (
                  <p className="text-xs text-zinc-600">Sem aulas programadas.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {doDia.map((aula) => {
                      const suspensa = suspensaEm(aula.id, dia);
                      const qtdOcupadas = ocupadas(aula.id, dia);

                      return (
                        <span
                          key={aula.id}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs border ${
                            suspensa
                              ? "border-red-500/25 bg-red-950/30 text-red-400"
                              : "border-white/5 bg-zinc-900 text-zinc-300"
                          }`}
                        >
                          <span className="font-semibold text-white">
                            {formatoHorario(aula.horario)}
                          </span>
                          <span className="text-zinc-500">·</span>
                          <span>{aula.tipo_aula}</span>
                          <span className="text-zinc-500">·</span>
                          <span
                            className={
                              qtdOcupadas >= aula.limite_vagas
                                ? "text-amber-400 font-semibold"
                                : "text-emerald-400"
                            }
                          >
                            {qtdOcupadas}/{aula.limite_vagas}
                          </span>
                        </span>
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

function AcaoSuspender({
  aulaId,
  data,
  suspensa,
}: {
  aulaId: string;
  data: string;
  suspensa: boolean;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [state, formAction, pending] = useActionState<
    EstadoSuspensao,
    FormData
  >(async (prevState, formData) => {
    const res = await alternarSuspensao(aulaId, data, suspensa, prevState, formData);
    if (!res.error) {
      showToast(
        suspensa ? "Aula reativada com sucesso!" : "Aula suspensa nesta data.",
        "success"
      );
      setConfirmando(false);
    } else {
      showToast(res.error, "error");
    }
    return res;
  }, {});

  if (confirmando && !suspensa) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-red-300">Suspender aula?</span>
        <form action={formAction}>
          <button
            type="submit"
            disabled={pending}
            className="btn-press flex h-8 items-center gap-1 rounded-xl bg-red-600 px-3 text-xs font-bold text-white shadow-md shadow-red-900/30 disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Suspendendo...</span>
              </>
            ) : (
              "Confirmar"
            )}
          </button>
        </form>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmando(false)}
          className="btn-press flex h-8 items-center rounded-xl border border-white/10 px-2.5 text-xs text-zinc-400 hover:text-white"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        if (!suspensa) {
          setConfirmando(true);
        } else {
          formAction(formData);
        }
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className={`btn-press flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
          suspensa
            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 shadow-sm"
            : "border border-white/10 bg-zinc-900/60 text-zinc-400 hover:border-red-500/30 hover:bg-red-950/30 hover:text-red-300"
        }`}
      >
        {pending ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Salvando...</span>
          </span>
        ) : suspensa ? (
          <>
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reativar aula hoje</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Suspender aula hoje</span>
          </>
        )}
      </button>
      {state?.error && (
        <p className="mt-1 text-xs text-red-400" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
