import { buscarAluno, calcularIdade } from "@/lib/services/alunos";
import { saldoDoAluno } from "@/lib/services/planos";
import { formatarData } from "@/lib/constantes";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Edit3,
  Phone,
  Briefcase,
  Building2,
  HeartPulse,
  AlertTriangle,
  Dumbbell,
  Sparkles,
  FileText,
  Ticket,
  User,
} from "lucide-react";
import { BotaoExcluirAluno } from "../botao-excluir";

export const metadata = { title: "Ficha do Aluno" };

function extrairIniciais(nome: string) {
  const partes = nome.trim().split(" ");
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export default async function FichaAlunoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const aluno = await buscarAluno(id);

  if (!aluno) notFound();

  const idade = await calcularIdade(aluno.data_nascimento);
  const saldo = await saldoDoAluno(aluno.id);
  const isAtivo = aluno.status === "ativo";
  const telLimpo = aluno.telefone ? aluno.telefone.replace(/\D/g, "") : "";
  const linkWhats =
    telLimpo.length >= 10 ? `https://wa.me/55${telLimpo}` : null;

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Barra de Navegação Superior */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/alunos"
          className="btn-press flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-white transition-colors"
          aria-label="Voltar para a lista de alunos"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/alunos/${aluno.id}/editar`}
            className="btn-press flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-3.5 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Editar Ficha</span>
          </Link>
        </div>
      </div>

      {/* Cartão de Identificação Principal */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-5 border border-white/10 shadow-xl shadow-black/30">
        <div className="flex items-start gap-3.5">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold ${
              isAtivo
                ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-zinc-950 shadow-lg shadow-emerald-500/20"
                : "bg-zinc-800 text-zinc-400 border border-white/10"
            }`}
          >
            {extrairIniciais(aluno.nome)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white truncate">
                {aluno.nome}
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border shrink-0 ${
                  isAtivo
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                    : "border-white/10 bg-zinc-800 text-zinc-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isAtivo ? "bg-emerald-400" : "bg-zinc-500"
                  }`}
                />
                {isAtivo ? "Ativo" : "Inativo"}
              </span>
            </div>

            {/* Idade e Data de Nascimento */}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              {idade !== null ? (
                <span className="font-medium text-emerald-300">
                  {idade} anos{" "}
                  <span className="text-zinc-500">
                    ({formatarData(aluno.data_nascimento!)})
                  </span>
                </span>
              ) : (
                <span className="text-zinc-500">Data de nasc. não informada</span>
              )}
            </div>
          </div>
        </div>

        {/* Linha de Destaques Rápidos (WhatsApp + Saldo) */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/5 pt-3.5">
          {linkWhats ? (
            <a
              href={linkWhats}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-press flex h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{aluno.telefone}</span>
            </a>
          ) : (
            <div className="flex h-10 items-center justify-center rounded-xl bg-zinc-900/50 px-3 text-xs text-zinc-500 border border-white/5">
              Sem telefone
            </div>
          )}

          <div className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-zinc-900/80 px-3 text-xs font-semibold text-zinc-200 border border-white/10">
            <Ticket className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>
              Saldo: <strong className="text-white">{saldo}</strong> {saldo === 1 ? "aula" : "aulas"}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BLOCO 1: DADOS PESSOAIS */}
      {/* ========================================================= */}
      <section className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-col gap-3.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <User className="h-4 w-4" />
          <span>1. Dados Pessoais</span>
        </div>

        <div className="grid grid-cols-1 gap-3 text-xs">
          {/* Profissão */}
          <div className="flex flex-col gap-1 rounded-2xl bg-zinc-900/60 p-3.5 border border-white/5">
            <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
              <Briefcase className="h-3.5 w-3.5 text-zinc-500" />
              Profissão / Trabalho
            </span>
            <p className="text-sm font-semibold text-white">
              {aluno.profissao || <span className="font-normal text-zinc-500">Não informada</span>}
            </p>
          </div>

          {/* Empresa */}
          <div className="flex flex-col gap-1 rounded-2xl bg-zinc-900/60 p-3.5 border border-white/5">
            <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
              <Building2 className="h-3.5 w-3.5 text-zinc-500" />
              Empresa Própria
            </span>
            {aluno.tem_empresa ? (
              <div className="mt-0.5 flex flex-col gap-0.5">
                <p className="text-sm font-bold text-white">
                  {aluno.empresa_nome || "Empresa sem nome registrado"}
                </p>
                {aluno.empresa_ramo && (
                  <p className="text-xs text-emerald-300">
                    Ramo: {aluno.empresa_ramo}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">Não possui empresa própria</p>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* BLOCO 2: SAÚDE E TREINO */}
      {/* ========================================================= */}
      <section className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-col gap-3.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
          <HeartPulse className="h-4 w-4" />
          <span>2. Saúde e Treino</span>
        </div>

        <div className="flex flex-col gap-3">
          {/* Dores crônicas */}
          <div
            className={`flex flex-col gap-1.5 rounded-2xl p-3.5 border transition-all ${
              aluno.tem_dores_cronicas
                ? "border-amber-500/30 bg-amber-950/20"
                : "border-white/5 bg-zinc-900/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                <AlertTriangle
                  className={`h-4 w-4 ${
                    aluno.tem_dores_cronicas ? "text-amber-400" : "text-zinc-500"
                  }`}
                />
                Dores Crônicas
              </span>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  aluno.tem_dores_cronicas
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {aluno.tem_dores_cronicas ? "Sim" : "Não relatado"}
              </span>
            </div>

            {aluno.tem_dores_cronicas && (
              <p className="mt-1 text-xs text-amber-200/90 leading-relaxed">
                {aluno.dores_cronicas_descricao || "Descrição de dores não preenchida."}
              </p>
            )}
          </div>

          {/* Lesões e cirurgias */}
          <div className="flex flex-col gap-1 rounded-2xl bg-zinc-900/60 p-3.5 border border-white/5">
            <span className="text-[11px] font-medium text-zinc-400">
              Lesões, cirurgias ou limitações
            </span>
            <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {aluno.lesoes || <span className="text-zinc-500">Nenhum registro</span>}
            </p>
          </div>

          {/* Estilo de treino */}
          <div className="flex flex-col gap-1 rounded-2xl bg-zinc-900/60 p-3.5 border border-white/5">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
              <Dumbbell className="h-3.5 w-3.5 text-zinc-500" />
              Estilo de Treino & Objetivos
            </span>
            <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {aluno.estilo_treino || (
                <span className="text-zinc-500">Ainda não definido</span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* BLOCO 3: CONHECENDO O ALUNO (VÍNCULO) */}
      {/* ========================================================= */}
      <section className="glass-panel rounded-3xl p-5 border border-purple-500/20 flex flex-col gap-3.5 bg-gradient-to-b from-purple-950/10 to-transparent">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
          <Sparkles className="h-4 w-4" />
          <span>3. Conhecendo o Aluno (Criar Vínculo)</span>
        </div>

        {/* Perfil pessoal com destaque */}
        <div className="flex flex-col gap-1.5 rounded-2xl bg-zinc-900/70 p-4 border border-purple-500/20 shadow-sm">
          <span className="text-[11px] font-semibold text-purple-300">
            Anotações de Relacionamento & Conexão
          </span>
          {aluno.descricao_aluno ? (
            <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {aluno.descricao_aluno}
            </p>
          ) : (
            <p className="text-xs text-zinc-500 italic">
              Nenhuma anotação pessoal cadastrada. Toque em &quot;Editar Ficha&quot; para registrar família, pets, hobbies e assuntos preferidos.
            </p>
          )}
        </div>

        {/* Observações Gerais */}
        {aluno.observacoes && (
          <div className="flex flex-col gap-1 rounded-2xl bg-zinc-900/60 p-3.5 border border-white/5">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
              <FileText className="h-3.5 w-3.5 text-zinc-500" />
              Observações Gerais
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {aluno.observacoes}
            </p>
          </div>
        )}
      </section>

      {/* Ações do Rodapé */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <BotaoExcluirAluno id={aluno.id} />

        <Link
          href={`/alunos/${aluno.id}/editar`}
          className="btn-press flex h-11 items-center gap-2 rounded-2xl bg-zinc-800 border border-white/10 px-4 text-xs font-bold text-white hover:bg-zinc-700 transition-colors"
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>Editar Aluno</span>
        </Link>
      </div>
    </div>
  );
}