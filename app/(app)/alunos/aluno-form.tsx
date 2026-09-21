"use client";

import Link from "next/link";
import { useState, useActionState } from "react";
import { createAluno, updateAluno } from "./actions";
import {
  User,
  Phone,
  Calendar,
  Briefcase,
  Building2,
  HeartPulse,
  AlertTriangle,
  Dumbbell,
  Sparkles,
  FileText,
  ShieldCheck,
  Loader2,
  Check,
  AlertCircle,
  CircleDollarSign,
  Tag,
  Percent,
} from "lucide-react";
import type { AlunoCompleto, PeriodicidadePlano } from "@/lib/services/alunos";
import { type Plano, calcularPlanoTrimestral } from "@/lib/planos-calculo";

function calcularIdadeCliente(dataStr: string): number | null {
  if (!dataStr) return null;
  const partes = dataStr.split("-").map(Number);
  if (partes.length !== 3) return null;
  const [ano, mes, dia] = partes;
  if (!ano || !mes || !dia) return null;

  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;
  const m = hoje.getMonth() + 1;
  const d = hoje.getDate();
  if (m < mes || (m === mes && d < dia)) {
    idade--;
  }
  return idade >= 0 ? idade : null;
}

export function AlunoForm({
  aluno,
  planos = [],
}: {
  aluno?: AlunoCompleto | null;
  planos?: Plano[];
}) {
  const acao = aluno ? updateAluno.bind(null, aluno.id) : createAluno;
  const [state, formAction, pending] = useActionState(acao, {});

  const [dataNasc, setDataNasc] = useState(aluno?.data_nascimento ?? "");
  const [temEmpresa, setTemEmpresa] = useState<boolean>(Boolean(aluno?.tem_empresa));
  const [temDores, setTemDores] = useState<boolean>(Boolean(aluno?.tem_dores_cronicas));

  // Estado do Plano e Acordo Financeiro
  const [planoId, setPlanoId] = useState(aluno?.plano_padrao_id ?? "");
  const [periodicidade, setPeriodicidade] = useState<PeriodicidadePlano>(
    aluno?.periodicidade ?? "mensal"
  );
  const [valorMensalidade, setValorMensalidade] = useState<string>(
    aluno?.valor_mensalidade ? String(aluno.valor_mensalidade) : ""
  );

  const planoSelecionado = planos.find((p) => p.id === planoId);

  // Manipulador de troca de plano
  const handleSelecionarPlano = (novoId: string) => {
    setPlanoId(novoId);
    const p = planos.find((item) => item.id === novoId);
    if (p && p.preco_mensal) {
      if (periodicidade === "trimestral") {
        const calc = calcularPlanoTrimestral(p.preco_mensal);
        setValorMensalidade(calc.totalTrimestral.toFixed(2));
      } else {
        setValorMensalidade(p.preco_mensal.toFixed(2));
      }
    }
  };

  // Manipulador de troca de periodicidade (Mensal x Trimestral)
  const handleTrocarPeriodicidade = (novaPeriodicidade: PeriodicidadePlano) => {
    setPeriodicidade(novaPeriodicidade);
    if (planoSelecionado && planoSelecionado.preco_mensal) {
      if (novaPeriodicidade === "trimestral") {
        const calc = calcularPlanoTrimestral(planoSelecionado.preco_mensal);
        setValorMensalidade(calc.totalTrimestral.toFixed(2));
      } else {
        setValorMensalidade(planoSelecionado.preco_mensal.toFixed(2));
      }
    }
  };

  const idadeCalculada = calcularIdadeCliente(dataNasc);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* ========================================================= */}
      {/* BLOCO 1: DADOS PESSOAIS */}
      {/* ========================================================= */}
      <section className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-col gap-4 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">1. Dados Pessoais</h2>
            <p className="text-[11px] text-zinc-400">
              Identificação, contato e informações profissionais
            </p>
          </div>
        </div>

        {/* Nome Completo (Único obrigatório) */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            Nome Completo <span className="text-emerald-400">*</span>
          </span>
          <input
            type="text"
            name="nome"
            required
            maxLength={120}
            defaultValue={aluno?.nome ?? ""}
            placeholder="Ex: João da Silva"
            className="h-12 min-h-[44px] rounded-xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
          />
        </label>

        {/* Telefone / WhatsApp */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            <Phone className="h-3.5 w-3.5 text-zinc-400" />
            Telefone / WhatsApp
          </span>
          <input
            type="tel"
            name="telefone"
            maxLength={30}
            defaultValue={aluno?.telefone ?? ""}
            placeholder="Ex: (11) 98765-4321"
            className="h-12 min-h-[44px] rounded-xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
          />
        </label>

        {/* Data de Nascimento com prévia da idade */}
        <div className="flex flex-col gap-1.5">
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between text-xs font-semibold text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                Data de Nascimento
              </span>
              {idadeCalculada !== null && (
                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/20">
                  {idadeCalculada} {idadeCalculada === 1 ? "ano" : "anos"}
                </span>
              )}
            </span>
            <input
              type="date"
              name="data_nascimento"
              value={dataNasc}
              onChange={(e) => setDataNasc(e.target.value)}
              className="h-12 min-h-[44px] rounded-xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors [color-scheme:dark]"
            />
          </label>
          <span className="text-[11px] text-zinc-500">
            A idade é calculada automaticamente na ficha do aluno.
          </span>
        </div>

        {/* Profissão */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
            Profissão / O que trabalha
          </span>
          <input
            type="text"
            name="profissao"
            maxLength={120}
            defaultValue={aluno?.profissao ?? ""}
            placeholder="Ex: Arquiteta, Advogado autônomo, Engenheira..."
            className="h-12 min-h-[44px] rounded-xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
          />
        </label>

        {/* Tem empresa? (Seletor Sim/Não) */}
        <div className="flex flex-col gap-2 rounded-2xl bg-zinc-950/40 p-3.5 border border-white/5">
          <input
            type="hidden"
            name="tem_empresa"
            value={temEmpresa ? "true" : "false"}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <Building2 className="h-4 w-4 text-emerald-400" />
              Tem empresa própria?
            </span>
            <div className="flex rounded-xl bg-zinc-900 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setTemEmpresa(false)}
                className={`min-h-[38px] px-3.5 rounded-lg text-xs font-semibold transition-all ${
                  !temEmpresa
                    ? "bg-zinc-700 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => setTemEmpresa(true)}
                className={`min-h-[38px] px-3.5 rounded-lg text-xs font-semibold transition-all ${
                  temEmpresa
                    ? "bg-emerald-500 text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Sim
              </button>
            </div>
          </div>

          {/* Campos condicionais de empresa */}
          {temEmpresa && (
            <div className="mt-2.5 flex flex-col gap-3 border-t border-white/5 pt-3 animate-in fade-in duration-200">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-zinc-400">
                  Nome da empresa (opcional)
                </span>
                <input
                  type="text"
                  name="empresa_nome"
                  maxLength={120}
                  defaultValue={aluno?.empresa_nome ?? ""}
                  placeholder="Ex: Studio Bella Arquitetura"
                  className="h-11 min-h-[44px] rounded-xl border border-white/10 bg-zinc-900 px-3.5 text-xs text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-zinc-400">
                  Ramo de atuação (opcional)
                </span>
                <input
                  type="text"
                  name="empresa_ramo"
                  maxLength={120}
                  defaultValue={aluno?.empresa_ramo ?? ""}
                  placeholder="Ex: Construção civil e design de interiores"
                  className="h-11 min-h-[44px] rounded-xl border border-white/10 bg-zinc-900 px-3.5 text-xs text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
              </label>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* BLOCO 2: SAÚDE E TREINO */}
      {/* ========================================================= */}
      <section className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-col gap-4 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-400">
            <HeartPulse className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">2. Saúde e Treino</h2>
            <p className="text-[11px] text-zinc-400">
              Restrições, histórico físico e estilo de treino do aluno
            </p>
          </div>
        </div>

        {/* Tem dores crônicas? (Seletor Sim/Não) */}
        <div className="flex flex-col gap-2 rounded-2xl bg-zinc-950/40 p-3.5 border border-white/5">
          <input
            type="hidden"
            name="tem_dores_cronicas"
            value={temDores ? "true" : "false"}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <AlertTriangle className={`h-4 w-4 ${temDores ? "text-amber-400" : "text-zinc-500"}`} />
              Tem dores crônicas?
            </span>
            <div className="flex rounded-xl bg-zinc-900 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setTemDores(false)}
                className={`min-h-[38px] px-3.5 rounded-lg text-xs font-semibold transition-all ${
                  !temDores
                    ? "bg-zinc-700 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => setTemDores(true)}
                className={`min-h-[38px] px-3.5 rounded-lg text-xs font-semibold transition-all ${
                  temDores
                    ? "bg-amber-500 text-zinc-950 shadow-sm font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Sim
              </button>
            </div>
          </div>

          {/* Campo condicional de descrição de dores */}
          {temDores && (
            <div className="mt-2.5 flex flex-col gap-1.5 border-t border-white/5 pt-3 animate-in fade-in duration-200">
              <span className="text-[11px] font-medium text-amber-300">
                Onde e como são as dores?
              </span>
              <textarea
                name="dores_cronicas_descricao"
                maxLength={1000}
                rows={3}
                defaultValue={aluno?.dores_cronicas_descricao ?? ""}
                placeholder="Ex: Dor na lombar ao ficar muito tempo em pé, incômodo no joelho direito após corrida..."
                className="rounded-xl border border-amber-500/30 bg-zinc-900/90 px-3.5 py-3 text-xs text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Lesões e Cirurgias */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            <AlertCircle className="h-3.5 w-3.5 text-zinc-400" />
            Lesões, cirurgias ou limitações
          </span>
          <textarea
            name="lesoes"
            maxLength={1000}
            rows={3}
            defaultValue={aluno?.lesoes ?? ""}
            placeholder="Ex: Cirurgia de menisco em 2021, hérnia de disco L4-L5 tratada, evitar hiperextensão..."
            className="rounded-xl border border-white/10 bg-zinc-900/90 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors resize-none leading-relaxed"
          />
        </label>

        {/* Estilo de Treino */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            <Dumbbell className="h-3.5 w-3.5 text-zinc-400" />
            Estilo de treino e preferências
          </span>
          <textarea
            name="estilo_treino"
            maxLength={1000}
            rows={3}
            defaultValue={aluno?.estilo_treino ?? ""}
            placeholder="Ex: Gosta de treinos dinâmicos, prefere evitar esteira longa, foco em fortalecimento postural..."
            className="rounded-xl border border-white/10 bg-zinc-900/90 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors resize-none leading-relaxed"
          />
        </label>
      </section>

      {/* ========================================================= */}
      {/* BLOCO 3: CONHECENDO O ALUNO (CRIAR VÍNCULO) */}
      {/* ========================================================= */}
      <section className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-col gap-4 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/20 text-purple-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">3. Conhecendo o Aluno</h2>
            <p className="text-[11px] text-zinc-400">
              Anotações pessoais para criar conexão e fortalecer o relacionamento
            </p>
          </div>
        </div>

        {/* Breve descrição do aluno (Campo maior e aconchegante) */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            Perfil pessoal do aluno
          </span>
          <textarea
            name="descricao_aluno"
            maxLength={3000}
            rows={5}
            defaultValue={aluno?.descricao_aluno ?? ""}
            placeholder="Anote detalhes que fortalecem o vínculo: família, filhos, pets (nome do cachorro), time de futebol, hobbies, viagens recentes, assuntos que adora conversar, o que mais o motiva..."
            className="rounded-xl border border-purple-500/30 bg-zinc-900/90 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-colors resize-none leading-relaxed"
          />
          <span className="text-[11px] text-zinc-500">
            Use este espaço livre para lembrar de detalhes importantes antes de cada aula.
          </span>
        </label>

        {/* Observações Gerais */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            <FileText className="h-3.5 w-3.5 text-zinc-400" />
            Observações gerais
          </span>
          <textarea
            name="observacoes"
            maxLength={2000}
            rows={3}
            defaultValue={aluno?.observacoes ?? ""}
            placeholder="Anotações administrativas, preferências de horários, etc."
            className="rounded-xl border border-white/10 bg-zinc-900/90 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors resize-none leading-relaxed"
          />
        </label>

        {/* Status no Estúdio */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Status no Estúdio
          </span>
          <select
            name="status"
            defaultValue={aluno?.status ?? "ativo"}
            className="h-12 min-h-[44px] rounded-xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors [color-scheme:dark]"
          >
            <option value="ativo" className="bg-zinc-900 text-white">
              Ativo (pode agendar aulas)
            </option>
            <option value="inativo" className="bg-zinc-900 text-white">
              Inativo (pausado / trancado)
            </option>
          </select>
        </label>
      </section>

      {/* ========================================================= */}
      {/* BLOCO 4: ACORDO DE PLANO & MENSALIDADE (COBRANÇAS) */}
      {/* ========================================================= */}
      <section className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-col gap-4 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">
            <CircleDollarSign className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">4. Plano & Acordo Financeiro</h2>
            <p className="text-[11px] text-zinc-400">
              Vincule o aluno a um plano, escolha mensal ou trimestral e defina o vencimento
            </p>
          </div>
        </div>

        {/* 1. Seleção de Plano */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center justify-between text-xs font-semibold text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-emerald-400" />
              Plano de Atendimento
            </span>
            {planoSelecionado && (
              <span className="text-[11px] font-normal text-emerald-400">
                {planoSelecionado.frequencia_semanal}x por semana
              </span>
            )}
          </label>
          <select
            value={planoId}
            onChange={(e) => handleSelecionarPlano(e.target.value)}
            className="h-12 min-h-[44px] rounded-xl border border-white/10 bg-zinc-900/90 px-3.5 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors [color-scheme:dark]"
          >
            <option value="">Sem plano padrão (valor avulso ou personalizado)</option>
            {planos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} — R$ {p.preco_mensal ? p.preco_mensal.toFixed(2).replace(".", ",") : "0,00"}/mês ({p.frequencia_semanal}x/sem)
              </option>
            ))}
          </select>
          <input type="hidden" name="plano_padrao_id" value={planoId} />
        </div>

        {/* 2. Seletor de Periodicidade (Pill Toggle) */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            <Percent className="h-3.5 w-3.5 text-emerald-400" />
            Periodicidade de Cobrança
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-900/80 border border-white/10">
            <button
              type="button"
              onClick={() => handleTrocarPeriodicidade("mensal")}
              className={`h-10 min-h-[40px] rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                periodicidade === "mensal"
                  ? "bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => handleTrocarPeriodicidade("trimestral")}
              className={`h-10 min-h-[40px] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                periodicidade === "trimestral"
                  ? "bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>Trimestral</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                  periodicidade === "trimestral"
                    ? "bg-zinc-950/30 text-zinc-950"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                5% OFF
              </span>
            </button>
          </div>
          <input type="hidden" name="periodicidade" value={periodicidade} />
        </div>

        {/* Card Explicativo de Economia no Trimestral */}
        {periodicidade === "trimestral" && planoSelecionado && planoSelecionado.preco_mensal && (() => {
          const calc = calcularPlanoTrimestral(planoSelecionado.preco_mensal);
          return (
            <div className="flex flex-col gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-300 animate-in fade-in duration-150">
              <div className="flex items-center justify-between font-bold text-white">
                <span>Plano Trimestral com 5% de Desconto</span>
                <span className="text-emerald-400 font-extrabold">
                  R$ {calc.totalTrimestral.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                De <span className="line-through text-zinc-500">R$ {calc.totalSemDesconto.toFixed(2).replace(".", ",")}</span> por <strong className="text-emerald-300">R$ {calc.totalTrimestral.toFixed(2).replace(".", ",")}</strong> (economia de <strong>R$ {calc.economia.toFixed(2).replace(".", ",")}</strong>).
              </p>
              <span className="text-[10px] text-zinc-400">
                Cobrado a cada 3 meses · equivale a aprox. R$ {calc.equivalentePorMes.toFixed(2).replace(".", ",")}/mês.
              </span>
            </div>
          );
        })()}

        {/* 3. Valores e Dia de Vencimento */}
        <div className="grid grid-cols-2 gap-3">
          {/* Valor da Cobrança */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-zinc-300">
              {periodicidade === "trimestral" ? "Valor Trimestral (R$)" : "Valor Mensal (R$)"}
            </span>
            <input
              type="number"
              step="0.01"
              min="1"
              name="valor_mensalidade"
              value={valorMensalidade}
              onChange={(e) => setValorMensalidade(e.target.value)}
              placeholder="Ex: 349,90"
              className="h-12 min-h-[44px] rounded-xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
            />
          </label>

          {/* Dia de Vencimento */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-zinc-300">
              Dia de Vencimento
            </span>
            <input
              type="number"
              min="1"
              max="31"
              name="dia_vencimento"
              defaultValue={aluno?.dia_vencimento ?? ""}
              placeholder="Ex: 10 (todo dia 10)"
              className="h-12 min-h-[44px] rounded-xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
            />
          </label>
        </div>

        <p className="text-[11px] text-zinc-400 leading-relaxed">
          💡 O valor é preenchido automaticamente ao escolher o plano, mas você pode ajustá-lo livremente para acordos especiais. A frequência semanal e a validade serão respeitadas na agenda.
        </p>
      </section>

      {/* Exibição de Erro do Servidor */}
      {state?.error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Botões de Ação Fixos / Destacados */}
      <div className="flex gap-3 pt-2">
        <Link
          href={aluno ? `/alunos/${aluno.id}` : "/alunos"}
          className="btn-press flex h-12 min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/80 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="btn-press flex h-12 min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>{aluno ? "Salvar Ficha" : "Cadastrar Aluno"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}