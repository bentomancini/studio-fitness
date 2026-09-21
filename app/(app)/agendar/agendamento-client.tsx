"use client";

import Link from "next/link";
import { useActionState, useState, useRef } from "react";
import {
  dataHoje,
  diaDaSemana,
  formatarData,
  formatoHorario,
} from "@/lib/constantes";
import { agendarAula, cancelarAgendamento, EstadoAcao } from "./actions";
import { showToast } from "@/components/toast";
import {
  User,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Loader2,
  Users,
} from "lucide-react";

type Aula = {
  id: string;
  tipo_aula: string;
  dia_semana: number;
  horario: string;
  limite_vagas: number;
};

type Aluno = {
  id: string;
  nome: string;
  telefone: string;
  plano_padrao_id?: string | null;
  frequencia_semanal?: number | null;
  plano_nome?: string | null;
  periodicidade?: string | null;
  validade_plano?: string | null;
};

type Agendamento = { aula_id: string; aluno_id: string; data: string };

type Suspensao = { aula_id: string; data: string };

function adicionarDias(data: string, dias: number) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const dt = new Date(ano, mes - 1, dia + dias);
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${m}-${d}`;
}

function obterLimitesDaSemana(dataStr: string) {
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  const dt = new Date(ano, mes - 1, dia);
  const diaSemana = dt.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const diffSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
  const seg = new Date(ano, mes - 1, dia + diffSegunda);
  const sab = new Date(seg.getFullYear(), seg.getMonth(), seg.getDate() + 5);
  const dom = new Date(seg.getFullYear(), seg.getMonth(), seg.getDate() + 6);

  const toIso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return {
    inicioSemana: toIso(seg),
    fimSemana: toIso(dom),
    inicioFormatado: `${String(seg.getDate()).padStart(2, "0")}/${String(seg.getMonth() + 1).padStart(2, "0")}`,
    fimFormatado: `${String(sab.getDate()).padStart(2, "0")}/${String(sab.getMonth() + 1).padStart(2, "0")}`,
  };
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
  const amanha = adicionarDias(hoje, 1);
  if (data === amanha) {
    return `Amanhã · ${nomesSemanaCurto[diaSemanaIdx]}, ${dNum} ${nomesMesCurto[mes - 1]}`;
  }
  return `${nomesSemanaCurto[diaSemanaIdx]}, ${dNum} de ${nomesMesCurto[mes - 1]}`;
}

export function Agendamento({
  alunos,
  aulas,
  agendamentos,
  suspensoes,
}: {
  alunos: Aluno[];
  aulas: Aula[];
  agendamentos: Agendamento[];
  suspensoes: Suspensao[];
}) {
  const [alunoId, setAlunoId] = useState(alunos[0]?.id ?? "");
  const [data, setData] = useState(dataHoje());
  const inputRef = useRef<HTMLInputElement>(null);

  const alunoSelecionado = alunos.find((a) => a.id === alunoId);
  const { inicioSemana, fimSemana, inicioFormatado, fimFormatado } = obterLimitesDaSemana(data);

  // Agendamentos deste aluno na semana selecionada
  const agendamentosSemanaAluno = agendamentos.filter(
    (g) => g.aluno_id === alunoId && g.data >= inicioSemana && g.data <= fimSemana
  );
  const qtdNaSemana = agendamentosSemanaAluno.length;
  const limiteSemanal = alunoSelecionado?.frequencia_semanal ?? null;
  const atingiuLimite = limiteSemanal !== null && qtdNaSemana >= limiteSemanal;

  // Checagem de validade do plano/pacote
  const validadeExpirada =
    Boolean(alunoSelecionado?.validade_plano) &&
    data > (alunoSelecionado?.validade_plano ?? "");

  const weekday = diaDaSemana(data);
  const doDia = aulas
    .filter((a) => a.dia_semana === weekday)
    .sort((a, b) => a.horario.localeCompare(b.horario));

  const hoje = dataHoje();
  const amanha = adicionarDias(hoje, 1);

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

  if (alunos.length === 0) {
    return (
      <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-500 border border-white/5">
          <User className="h-7 w-7 stroke-[1.5]" />
        </div>
        <h3 className="text-base font-semibold text-white">
          Nenhum aluno ativo encontrado
        </h3>
        <p className="mt-1 text-xs text-zinc-400">
          Cadastre ou ative um aluno para poder realizar agendamentos nas aulas.
        </p>
        <Link
          href="/alunos/novo"
          className="btn-press mt-5 flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-6 text-sm font-semibold text-zinc-950 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Cadastrar novo aluno
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Formulário de Seleção (Aluno e Data) */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-white/10 flex flex-col gap-4 shadow-lg shadow-black/30">
        {/* Seleção do Aluno */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <User className="h-3.5 w-3.5 text-emerald-400" />
            Aluno
          </span>
          <select
            value={alunoId}
            onChange={(e) => setAlunoId(e.target.value)}
            className="h-12 rounded-xl border border-white/10 bg-zinc-900/90 px-4 text-sm font-semibold text-white transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 cursor-pointer"
          >
            {alunos.map((a) => (
              <option key={a.id} value={a.id} className="bg-zinc-900 text-white">
                {a.nome} {a.telefone ? `(${a.telefone})` : ""}
              </option>
            ))}
          </select>
        </label>

        {/* Info do Plano do Aluno Selecionado */}
        {alunoSelecionado && (
          <div className="flex flex-col gap-2 rounded-2xl bg-zinc-900/60 p-3.5 border border-white/5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Plano do Aluno:</span>
              <span className="font-bold text-white">
                {alunoSelecionado.plano_nome ?? "Sem plano fixo (Avulso)"}
              </span>
            </div>
            {limiteSemanal !== null && (
              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <span className="text-zinc-400">Aulas nesta semana ({inicioFormatado} a {fimFormatado}):</span>
                <span
                  className={`font-bold rounded-md px-2 py-0.5 text-[11px] ${
                    atingiuLimite
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {qtdNaSemana} de {limiteSemanal} {limiteSemanal === 1 ? "aula" : "aulas"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Alerta de Limite Semanal Atingido */}
        {atingiuLimite && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-950/25 p-3.5 text-xs text-amber-200 animate-in fade-in duration-150">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-white">Limite semanal atingido ({qtdNaSemana}/{limiteSemanal} aulas)</span>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                {alunoSelecionado?.nome} já possui {qtdNaSemana} aula(s) agendada(s) nesta semana ({inicioFormatado} a {fimFormatado}). O agendamento é permitido para reposição ou aula extra combinada.
              </p>
            </div>
          </div>
        )}

        {/* Alerta de Validade Expirada */}
        {validadeExpirada && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-950/25 p-3.5 text-xs text-rose-200 animate-in fade-in duration-150">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-white">Plano/Pacote Expirado</span>
              <p className="text-[11px] text-rose-200/90 leading-relaxed">
                A data selecionada ({formatarData(data)}) é posterior à validade do plano do aluno ({formatarData(alunoSelecionado?.validade_plano ?? "")}). Verifique o acerto de renovação.
              </p>
            </div>
          </div>
        )}

        {/* Seleção de Data — Card Unificado, acessível e sem sobreposição */}
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            Data da Aula
          </span>
          <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-zinc-900/60 p-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={data <= hoje}
                onClick={() => setData(adicionarDias(data, -1))}
                aria-label="Dia anterior"
                className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:scale-90 transition-all border border-white/10 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="relative flex min-h-11 flex-1 items-center justify-center rounded-xl bg-zinc-900/90 px-3 border border-white/10 hover:border-emerald-500/40 transition-colors">
                <input
                  ref={inputRef}
                  type="date"
                  value={data}
                  min={hoje}
                  onChange={(e) => {
                    if (e.target.value) {
                      setData(e.target.value);
                      showToast(`Data: ${formatarData(e.target.value)}`, "info");
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
                onClick={() => setData(adicionarDias(data, 1))}
                aria-label="Próximo dia"
                className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:scale-90 transition-all border border-white/10"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Atalhos Rápidos */}
            <div className="grid grid-cols-2 gap-1.5 border-t border-white/5 pt-1.5">
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
                    ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                    : "border border-white/5 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Amanhã
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Aulas no Dia Selecionado */}
      <div>
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Aulas em {formatarData(data)}
          </h2>
          <span className="text-xs text-zinc-500">
            {doDia.length} {doDia.length === 1 ? "horário" : "horários"}
          </span>
        </div>

        {doDia.length === 0 ? (
          <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-8 text-center">
            <Clock className="mb-2 h-7 w-7 text-zinc-600 stroke-[1.5]" />
            <p className="text-sm font-semibold text-zinc-300">
              Não há aulas cadastradas nesta data
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Escolha outro dia ou cadastre novas aulas para este dia da semana.
            </p>
          </div>
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
              const porcentagem = Math.min(
                100,
                Math.round((ocupadas / aula.limite_vagas) * 100)
              );

              return (
                <li
                  key={aula.id}
                  className={`glass-panel interactive-card relative overflow-hidden rounded-3xl p-4 border transition-all ${
                    agendado
                      ? "border-emerald-500/50 bg-emerald-950/20 shadow-lg shadow-emerald-500/5"
                      : suspensa
                      ? "border-red-500/20 bg-red-950/10 opacity-70"
                      : lotada
                      ? "border-amber-500/20"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="shrink-0 flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatoHorario(aula.horario)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold tracking-tight text-white truncate">
                          {aula.tipo_aula}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                        agendado
                          ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                          : suspensa
                          ? "border-red-500/30 bg-red-500/15 text-red-300"
                          : lotada
                          ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
                          : "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                      }`}
                    >
                      {agendado ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Agendado
                        </>
                      ) : suspensa ? (
                        "Suspensa"
                      ) : lotada ? (
                        "Lotada"
                      ) : (
                        "Disponível"
                      )}
                    </span>
                  </div>

                  {/* Barra de Ocupação */}
                  <div className="mt-3.5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-zinc-500" />
                        {ocupadas} de {aula.limite_vagas} vagas ocupadas
                      </span>
                      <span className="font-medium text-zinc-500">
                        {porcentagem}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          agendado
                            ? "bg-emerald-400"
                            : lotada
                            ? "bg-amber-400"
                            : "bg-gradient-to-r from-emerald-500 to-emerald-400"
                        }`}
                        style={{ width: `${porcentagem}%` }}
                      />
                    </div>
                  </div>

                  {/* Ação: Agendar ou Cancelar com confirmação inline instantânea */}
                  <div className="mt-3.5 border-t border-white/5 pt-3">
                    {agendado ? (
                      <AcaoCancelar
                        aulaId={aula.id}
                        alunoId={alunoId}
                        data={data}
                      />
                    ) : suspensa || lotada ? (
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <AlertCircle className="h-4 w-4 text-zinc-500 shrink-0" />
                        <span>
                          {suspensa
                            ? "Esta aula foi suspensa nesta data."
                            : "Turma lotada. Não há vagas livres."}
                        </span>
                      </div>
                    ) : (
                      <AcaoAgendar
                        aulaId={aula.id}
                        alunoId={alunoId}
                        data={data}
                      />
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

function AcaoAgendar({
  aulaId,
  alunoId,
  data,
}: {
  aulaId: string;
  alunoId: string;
  data: string;
}) {
  const [state, formAction, pending] = useActionState<EstadoAcao, FormData>(
    async (prevState, formData) => {
      const res = await agendarAula(aulaId, alunoId, data, prevState, formData);
      if (res.ok) {
        showToast("Aluno agendado com sucesso! Saldo atualizado.", "success");
      } else if (res.error) {
        showToast(res.error, "error");
      }
      return res;
    },
    {}
  );

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className="btn-press flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-6 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Confirmando vaga com o estúdio...</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Agendar aluno nesta aula</span>
            </>
          )}
        </button>
      </form>
      {state?.error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-2 text-xs font-medium text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
    </div>
  );
}

function AcaoCancelar({
  aulaId,
  alunoId,
  data,
}: {
  aulaId: string;
  alunoId: string;
  data: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [state, formAction, pending] = useActionState<EstadoAcao, FormData>(
    async (prevState, formData) => {
      const res = await cancelarAgendamento(aulaId, alunoId, data, prevState, formData);
      if (res.ok) {
        showToast("Agendamento cancelado! Aula devolvida ao saldo.", "success");
        setConfirmando(false);
      } else if (res.error) {
        showToast(res.error, "error");
      }
      return res;
    },
    {}
  );

  if (confirmando) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-red-500/25 bg-red-950/30 p-3">
        <p className="text-xs font-medium text-red-200">
          Deseja cancelar o agendamento? O crédito de aula será estornado.
        </p>
        <div className="flex items-center gap-2">
          <form action={formAction}>
            <button
              type="submit"
              disabled={pending}
              className="btn-press flex h-9 items-center gap-1.5 rounded-xl bg-red-600 px-3.5 text-xs font-bold text-white shadow-md shadow-red-950/50 disabled:opacity-50"
            >
              {pending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Cancelando...</span>
                </>
              ) : (
                "Sim, cancelar"
              )}
            </button>
          </form>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmando(false)}
            className="btn-press flex h-9 items-center rounded-xl border border-white/10 px-3 text-xs text-zinc-300 hover:text-white"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirmando(true)}
        className="btn-press flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 px-4 text-xs font-semibold text-red-300 hover:bg-red-900/40 active:scale-98 transition-all disabled:opacity-50"
      >
        <XCircle className="h-3.5 w-3.5" />
        <span>Cancelar agendamento</span>
      </button>

      {state?.error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-2 text-xs font-medium text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
    </div>
  );
}