"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  X,
  Send,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Users,
  ChevronDown,
  Loader2,
  Bot,
} from "lucide-react";

type AcaoExecutada = {
  tipo: "agendamento" | "cancelamento" | "pagamento" | "cobranca_avulsa" | "consulta";
  titulo: string;
  detalhes: string;
  sucesso: boolean;
};

type MensagemItem = {
  id: string;
  role: "user" | "assistant";
  content: string;
  acoes?: AcaoExecutada[];
  erro?: boolean;
};

const SUGESTOES = [
  { texto: "Quem treina hoje?", icone: Calendar },
  { texto: "Quem está com mensalidade atrasada?", icone: DollarSign },
  { texto: "Quais aulas temos amanhã e vagas livres?", icone: Users },
  { texto: "Busca a ficha do aluno Carlos", icone: Sparkles },
];

export function CopilotoDrawer() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<MensagemItem[]>([
    {
      id: "boas-vindas",
      role: "assistant",
      content:
        "Olá! Sou o seu Copiloto inteligente do **Studio Brenno Mancini**, alimentado pelo **Claude**.\n\nPosso consultar e marcar aulas, desmarcar alunos, verificar mensalidades atrasadas ou dar baixa em pagamentos. Como posso te ajudar agora?",
    },
  ]);
  const [inputTexto, setInputTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const mensagensFimRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const idContadorRef = useRef(1);

  // Rolagem suave para o fim da conversa
  const rolarParaFim = useCallback(() => {
    mensagensFimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (aberto) {
      rolarParaFim();
    }
  }, [mensagens, aberto, carregando, rolarParaFim]);

  // Foca no input ao abrir e adiciona listener para tecla ESC no desktop
  useEffect(() => {
    if (aberto) {
      setTimeout(() => inputRef.current?.focus(), 150);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setAberto(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [aberto]);

  async function handleEnviar(textoParaEnviar?: string) {
    const texto = (textoParaEnviar || inputTexto).trim();
    if (!texto || carregando) return;

    idContadorRef.current += 1;
    const novoIdUser = `user-${idContadorRef.current}`;

    const novaMensagemUsuario: MensagemItem = {
      id: novoIdUser,
      role: "user",
      content: texto,
    };

    setMensagens((prev) => [...prev, novaMensagemUsuario]);
    setInputTexto("");
    setCarregando(true);

    try {
      // Monta histórico recente para o Claude (apenas 4 últimas mensagens para latência mínima)
      const historicoRecente = mensagens
        .filter((m) => m.id !== "boas-vindas")
        .slice(-4)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/copiloto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagem: texto,
          historico: historicoRecente,
        }),
      });

      const dados = await res.json();
      idContadorRef.current += 1;
      const novoIdAssistant = `assistant-${idContadorRef.current}`;

      if (dados.ok) {
        setMensagens((prev) => [
          ...prev,
          {
            id: novoIdAssistant,
            role: "assistant",
            content: dados.resposta,
            acoes: dados.acoes,
          },
        ]);
      } else {
        setMensagens((prev) => [
          ...prev,
          {
            id: novoIdAssistant,
            role: "assistant",
            content: dados.resposta || "Não foi possível obter resposta do Claude.",
            erro: true,
          },
        ]);
      }
    } catch {
      idContadorRef.current += 1;
      const novoIdErro = `error-${idContadorRef.current}`;
      setMensagens((prev) => [
        ...prev,
        {
          id: novoIdErro,
          role: "assistant",
          content: "Erro de conexão ao comunicar com o servidor do Copiloto.",
          erro: true,
        },
      ]);
    } finally {
      setCarregando(false);
    }
  }

  function handleLimparConversa() {
    setMensagens([
      {
        id: "boas-vindas-novo",
        role: "assistant",
        content: "Conversa reiniciada. No que posso te ajudar agora?",
      },
    ]);
  }

  return (
    <>
      {/* Botão Flutuante (Posição ergonômica: no mobile fica acima da BottomNav [bottom-24], no PC fica a 32px do rodapé [sm:bottom-8 sm:right-8]) */}
      <button
        onClick={() => setAberto(true)}
        aria-label="Abrir Copiloto IA do Studio"
        className={`fixed right-4 bottom-24 z-40 flex items-center gap-2.5 rounded-full px-4 py-3 text-xs font-semibold text-white shadow-2xl transition-all duration-300 active:scale-95 sm:right-8 sm:bottom-8 sm:px-4.5 sm:py-3.5 sm:text-sm ${
          aberto
            ? "pointer-events-none scale-0 opacity-0"
            : "scale-100 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-violet-950/70 ring-2 ring-violet-400/40 hover:scale-105 hover:brightness-110 hover:shadow-violet-900/80"
        }`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
        </span>
        <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
        <span className="tracking-wide">Copiloto Claude</span>
      </button>

      {/* Backdrop com blur moderno */}
      {aberto && (
        <div
          onClick={() => setAberto(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* Drawer Mobile / Modal Flutuante no PC */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[85dvh] max-h-[720px] w-full max-w-xl flex-col rounded-t-3xl border-t border-zinc-800/90 bg-zinc-950/98 text-zinc-100 shadow-2xl backdrop-blur-2xl transition-all duration-300 ease-out sm:inset-x-auto sm:right-8 sm:bottom-8 sm:h-[620px] sm:w-[430px] sm:rounded-2xl sm:border sm:border-zinc-800/90 sm:shadow-2xl sm:shadow-black/80 ${
          aberto
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-full opacity-0 pointer-events-none sm:translate-y-0 sm:scale-95"
        }`}
      >
        {/* Barra superior de arrasto (mobile) */}
        <div
          onClick={() => setAberto(false)}
          className="flex cursor-pointer justify-center pt-3 pb-1 sm:hidden"
        >
          <div className="h-1.5 w-12 rounded-full bg-zinc-700/80 active:bg-zinc-600" />
        </div>

        {/* Cabeçalho do Copiloto */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-md shadow-violet-950/60 ring-1 ring-white/10">
              <Sparkles className="h-4.5 w-4.5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">Copiloto IA</h3>
                <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300 border border-violet-500/30">
                  Claude
                </span>
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              </div>
              <p className="text-[11px] text-zinc-400">Studio Brenno Mancini Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleLimparConversa}
              title="Limpar histórico da conversa"
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 active:scale-90 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setAberto(false)}
              aria-label="Fechar"
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white active:scale-90 transition-all"
            >
              <ChevronDown className="h-5 w-5 sm:hidden" />
              <X className="hidden h-5 w-5 sm:block" />
            </button>
          </div>
        </div>

        {/* Corpo de Mensagens com scroll suave */}
        <div className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4 sm:px-5">
          {mensagens.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2 duration-200`}
            >
              {/* Balão de Mensagem */}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "rounded-br-xs bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-violet-950/40"
                    : m.erro
                    ? "rounded-bl-xs border border-rose-900/60 bg-rose-950/40 text-rose-200"
                    : "rounded-bl-xs border border-zinc-800/80 bg-zinc-900/90 text-zinc-200"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{m.content}</div>
              </div>

              {/* Cartões visuais de ações executadas pelo Claude */}
              {m.acoes && m.acoes.length > 0 && (
                <div className="mt-2 w-full max-w-[88%] space-y-1.5 animate-in fade-in duration-250">
                  {m.acoes.map((acao, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs shadow-xs ${
                        acao.sucesso
                          ? "border-emerald-800/60 bg-emerald-950/35 text-emerald-200"
                          : "border-amber-800/60 bg-amber-950/35 text-amber-200"
                      }`}
                    >
                      {acao.sucesso ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      )}
                      <div>
                        <div className="font-semibold">{acao.titulo}</div>
                        <div className="text-[11px] opacity-90">{acao.detalhes}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Indicador de Carregando / Claude pensando (Feedback Visual Imediato com 3 dots animados) */}
          {carregando && (
            <div className="flex items-start gap-2.5 animate-in fade-in duration-200">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
                <Bot className="h-4 w-4 text-violet-300" />
              </div>
              <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-xs border border-zinc-800/90 bg-zinc-900/95 px-4 py-3 text-xs text-zinc-300 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce"></span>
                </div>
                <span className="text-zinc-400 font-medium">Claude operando o estúdio...</span>
              </div>
            </div>
          )}

          <div ref={mensagensFimRef} />
        </div>

        {/* Chips de Sugestões Rápidas (quando histórico estiver pequeno) */}
        {mensagens.length <= 3 && !carregando && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-zinc-900/80 px-4 py-2 sm:px-5">
            {SUGESTOES.map((s, i) => {
              const Icone = s.icone;
              return (
                <button
                  key={i}
                  onClick={() => handleEnviar(s.texto)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-[11px] font-medium text-zinc-300 transition-all hover:border-violet-500/60 hover:bg-violet-950/30 hover:text-white active:scale-95"
                >
                  <Icone className="h-3 w-3 text-violet-400" />
                  <span>{s.texto}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Campo de Entrada de Mensagem com padding ergonômico no mobile */}
        <div className="border-t border-zinc-800/80 bg-zinc-950 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEnviar();
            }}
            className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              placeholder="Peça uma ação ou faça uma pergunta..."
              disabled={carregando}
              className="flex-1 bg-transparent py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={carregando || !inputTexto.trim()}
              aria-label="Enviar mensagem"
              className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-900/40 transition-all hover:bg-violet-500 hover:scale-105 active:scale-90 disabled:opacity-30 disabled:hover:scale-100"
            >
              {carregando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-zinc-500">
            Claude opera agenda, alunos, cobranças e baixas de pagamentos.
          </p>
        </div>
      </div>
    </>
  );
}
