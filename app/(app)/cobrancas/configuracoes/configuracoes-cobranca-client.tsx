"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfigCobranca } from "@/lib/services/cobrancas";
import { acaoSalvarConfiguracoesCobranca } from "../actions";
import { preencherTemplateMensagem } from "@/lib/services/whatsapp-cobranca";
import { showToast } from "@/components/toast";
import { dataHoje } from "@/lib/constantes";
import {
  ArrowLeft,
  QrCode,
  Save,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Loader2,
  CheckCheck,
} from "lucide-react";

const TEMPLATES_PADRAO: ConfigCobranca = {
  chave_pix: "",
  studio_nome: "Studio Brenno Mancini",
  msg_antecipada:
    "Olá, {primeiro_nome}! Passando para lembrar que sua mensalidade do Studio Brenno Mancini no valor de R$ {valor} vence no dia {vencimento}. Chave Pix: {chave_pix}. Qualquer dúvida, me avise!",
  msg_hoje:
    "Olá, {primeiro_nome}! Sua mensalidade do Studio Brenno Mancini no valor de R$ {valor} vence hoje ({vencimento}). Segue a chave Pix para pagamento: {chave_pix}. Obrigado!",
  msg_atraso:
    "Olá, {primeiro_nome}, tudo bem? Não identificamos o pagamento da sua mensalidade do Studio Brenno Mancini no valor de R$ {valor}, vencida em {vencimento}. Segue nossa chave Pix: {chave_pix}. Caso já tenha pago, por favor desconsidere!",
};

type Props = {
  configInicial: ConfigCobranca;
};

export function ConfiguracoesCobrancaClient({ configInicial }: Props) {
  const router = useRouter();
  const hoje = dataHoje();

  // Estados dos campos
  const [chavePix, setChavePix] = useState(configInicial.chave_pix);
  const [studioNome, setStudioNome] = useState(configInicial.studio_nome || "Studio Brenno Mancini");
  const [msgAntecipada, setMsgAntecipada] = useState(configInicial.msg_antecipada);
  const [msgHoje, setMsgHoje] = useState(configInicial.msg_hoje);
  const [msgAtraso, setMsgAtraso] = useState(configInicial.msg_atraso);

  // Aba ativa de edição de template
  const [abaTemplate, setAbaTemplate] = useState<"hoje" | "atraso" | "antecipada">("hoje");

  // Estado de salvamento
  const [salvando, setSalvando] = useState(false);

  // Template ativo atual
  const templateAtual =
    abaTemplate === "hoje"
      ? msgHoje
      : abaTemplate === "atraso"
      ? msgAtraso
      : msgAntecipada;

  function setTemplateAtual(novoTexto: string) {
    if (abaTemplate === "hoje") setMsgHoje(novoTexto);
    else if (abaTemplate === "atraso") setMsgAtraso(novoTexto);
    else setMsgAntecipada(novoTexto);
  }

  // Inserir tag de variável no texto
  function inserirVariavel(variavel: string) {
    setTemplateAtual(`${templateAtual} ${variavel}`);
  }

  // Restaurar template padrão da aba atual
  function restaurarPadrao() {
    if (abaTemplate === "hoje") setMsgHoje(TEMPLATES_PADRAO.msg_hoje);
    else if (abaTemplate === "atraso") setMsgAtraso(TEMPLATES_PADRAO.msg_atraso);
    else setMsgAntecipada(TEMPLATES_PADRAO.msg_antecipada);
    showToast("Modelo restaurado para o padrão sugerido.", "info");
  }

  // Prévia gerada com dados simulados
  const previaMensagem = preencherTemplateMensagem({
    nomeAluno: "Lucas Ferreira",
    valor: 250,
    dataVencimento: hoje,
    chavePix: chavePix || "(sua chave Pix cadastrada acima)",
    studioNome: studioNome || "Studio Brenno Mancini",
    template: templateAtual,
  });

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);

    try {
      const res = await acaoSalvarConfiguracoesCobranca({
        chave_pix: chavePix,
        studio_nome: studioNome,
        msg_antecipada: msgAntecipada,
        msg_hoje: msgHoje,
        msg_atraso: msgAtraso,
      });

      if (res.error) {
        showToast(res.error, "error");
      } else {
        showToast("Configurações salvas com sucesso!", "success");
        router.refresh();
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao salvar", "error");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Link
          href="/cobrancas"
          className="btn-press flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/80 text-zinc-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Configurações de Cobrança
          </h1>
          <p className="text-xs text-zinc-400">
            Chave Pix e modelos das mensagens do WhatsApp
          </p>
        </div>
      </div>

      <form onSubmit={handleSalvar} className="flex flex-col gap-5">
        {/* Card 1: Chave Pix & Studio */}
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900/80 p-4">
          <div className="flex items-center gap-2 text-white pb-2 border-b border-white/5">
            <QrCode className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold">Dados para Recebimento</h2>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Chave Pix Oficial
            </label>
            <input
              type="text"
              value={chavePix}
              onChange={(e) => setChavePix(e.target.value)}
              placeholder="Ex.: seu-email@gmail.com, CPF ou telefone"
              className="h-11 rounded-xl border border-white/10 bg-zinc-950 px-3.5 text-xs text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-zinc-400">
              Esta chave substituirá automaticamente a tag{" "}
              <code className="text-emerald-300">{"{chave_pix}"}</code> em todas as mensagens.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Nome do Estúdio
            </label>
            <input
              type="text"
              value={studioNome}
              onChange={(e) => setStudioNome(e.target.value)}
              placeholder="Studio Brenno Mancini"
              className="h-11 rounded-xl border border-white/10 bg-zinc-950 px-3.5 text-xs text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Card 2: Editor de Mensagens */}
        <div className="flex flex-col gap-3.5 rounded-2xl border border-white/10 bg-zinc-900/80 p-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2 text-white">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold">Modelos de Mensagem</h2>
            </div>

            <button
              type="button"
              onClick={restaurarPadrao}
              className="btn-press flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Restaurar padrão</span>
            </button>
          </div>

          {/* Abas dos 3 momentos */}
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-950 p-1 border border-white/5">
            <button
              type="button"
              onClick={() => setAbaTemplate("hoje")}
              className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                abaTemplate === "hoje"
                  ? "bg-amber-500 text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Vence Hoje
            </button>
            <button
              type="button"
              onClick={() => setAbaTemplate("atraso")}
              className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                abaTemplate === "atraso"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Atrasada
            </button>
            <button
              type="button"
              onClick={() => setAbaTemplate("antecipada")}
              className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                abaTemplate === "antecipada"
                  ? "bg-zinc-200 text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Antecipada
            </button>
          </div>

          {/* Variáveis dinâmicas para tocar e inserir */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              Toque em uma tag para inserir no texto:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { tag: "{primeiro_nome}", desc: "Ex: Lucas" },
                { tag: "{valor}", desc: "Ex: 250,00" },
                { tag: "{vencimento}", desc: "Ex: 10/10/2026" },
                { tag: "{chave_pix}", desc: "Chave Pix" },
                { tag: "{studio_nome}", desc: "Studio Brenno Mancini" },
              ].map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => inserirVariavel(v.tag)}
                  className="btn-press rounded-lg border border-white/10 bg-zinc-950 px-2 py-1 text-[10px] font-mono text-emerald-300 hover:border-emerald-500/40 active:scale-95"
                >
                  + {v.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea de edição */}
          <div className="flex flex-col gap-1">
            <textarea
              rows={4}
              value={templateAtual}
              onChange={(e) => setTemplateAtual(e.target.value)}
              className="rounded-xl border border-white/10 bg-zinc-950 p-3 text-xs text-white focus:border-emerald-500 focus:outline-none leading-relaxed resize-none"
            />
            <span className="text-right text-[10px] text-zinc-500">
              {templateAtual.length} caracteres
            </span>
          </div>
        </div>

        {/* Card 3: Prévia no Balão do WhatsApp */}
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900/80 p-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <span>Prévia da Mensagem no WhatsApp</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
                Simulação
              </span>
            </span>
            <span className="text-[10px] text-zinc-500">Para: Lucas</span>
          </div>

          {/* Fundo estilo WhatsApp Dark */}
          <div className="relative rounded-2xl bg-[#0b141a] p-4 border border-white/5 overflow-hidden">
            {/* Balão de mensagem verde do WhatsApp */}
            <div className="relative ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-[#005c4b] p-3 text-xs text-white shadow-md leading-relaxed whitespace-pre-wrap">
              {previaMensagem}

              <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-[#8696a0]">
                <span>10:42</span>
                <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
              </div>
            </div>
          </div>
        </div>

        {/* Botão de Salvar Alterações */}
        <button
          type="submit"
          disabled={salvando}
          className="btn-press flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          {salvando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4 stroke-[2.5]" />
              <span>Salvar Configurações</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
