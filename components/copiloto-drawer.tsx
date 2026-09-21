"use client";

import { useState, useRef, useEffect } from "react";
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
  useEffect(() => {
    if (aberto) {
      mensagensFimRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensagens, aberto, carregando]);

  // Foca no input ao abrir
  useEffect(() => {
    if (aberto) {
      setTimeout(() => inputRef.current?.focus(), 250);
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
      // Monta histórico recente para o Claude
      const historicoRecente = mensagens
        .filter((m) => m.id !== "boas-vindas")
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
      {/* Botão Flutuante (Bottom-Right, acima da BottomNav do iPhone) */}
      <button
        onClick={() => setAberto(true)}
        aria-label="Abrir Copiloto IA"
        className={`fixed right-4 bottom-22 z-40 flex items-center gap-2 rounded-full px-3.5 py-2.5 text-xs font-semibold text-white shadow-xl transition-all duration-300 active:scale-95 sm:right-6 sm:bottom-6 sm:px-4 sm:py-3 sm:text-sm ${
          aberto
            ? "pointer-events-none scale-0 opacity-0"
            : "scale-100 bg-linear-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-violet-950/60 ring-2 ring-violet-400/40 hover:brightness-110"
        }`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
        </span>
        <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
        <span>Copiloto Claude</span>
      </button>

      {/* Backdrop suave */}
      {aberto && (
        <div
          onClick={() => setAberto(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Drawer Mobile / Modal Deslizante */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[85vh] max-h-[700px] w-full max-w-xl flex-col rounded-t-3xl border-t border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl transition-transform duration-300 ease-out sm:inset-x-auto sm:right-6 sm:bottom-6 sm:h-[650px] sm:w-[420px] sm:rounded-2xl sm:border ${
          aberto ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
      >
        {/* Barra superior de arrasto (mobile) */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-zinc-800" />
        </div>

        {/* Cabeçalho do Copiloto */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-indigo-700 text-white shadow-md shadow-violet-950/50">
              <Sparkles className="h-4.5 w-4.5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">Copiloto IA</h3>
                <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300 border border-violet-500/30">
                  Claude
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Studio Brenno Mancini Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleLimparConversa}
              title="Limpar histórico da conversa"
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setAberto(false)}
              aria-label="Fechar"
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white active:scale-95"
            >
              <ChevronDown className="h-5 w-5 sm:hidden" />
              <X className="hidden h-5 w-5 sm:block" />
            </button>
          </div>
        </div>

        {/* Corpo de Mensagens */}
        <div className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4 sm:px-5">
          {mensagens.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              {/* Balão de Mensagem */}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-xs ${
                  m.role === "user"
                    ? "rounded-br-xs bg-linear-to-r from-violet-600 to-indigo-600 text-white"
                    : m.erro
                    ? "rounded-bl-xs border border-rose-900/60 bg-rose-950/40 text-rose-200"
                    : "rounded-bl-xs border border-zinc-800/80 bg-zinc-900/90 text-zinc-200"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{m.content}</div>
              </div>

              {/* Cartões visuais de ações executadas pelo Claude */}
              {m.acoes && m.acoes.length > 0 && (
                <div className="mt-2 w-full max-w-[85%] space-y-1.5">
                  {m.acoes.map((acao, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs ${
                        acao.sucesso
                          ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-200"
                          : "border-amber-800/60 bg-amber-950/30 text-amber-200"
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

          {/* Indicador de Carregando / Claude pensando */}
          {carregando && (
            <div className="flex items-start gap-2">
              <div className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-bl-xs border border-zinc-800/80 bg-zinc-900/90 px-3.5 py-2.5 text-xs text-zinc-400">
                <span className="flex h-2 w-2">
                  <span className="h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
                </span>
                <span>Claude operando o estúdio...</span>
              </div>
            </div>
          )}

          <div ref={mensagensFimRef} />
        </div>

        {/* Chips de Sugestões Rápidas (quando histórico está pequeno) */}
        {mensagens.length <= 3 && !carregando && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-zinc-900/60 px-4 py-2 sm:px-5">
            {SUGESTOES.map((s, i) => {
              const Icone = s.icone;
              return (
                <button
                  key={i}
                  onClick={() => handleEnviar(s.texto)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[11px] text-zinc-300 transition-colors hover:border-violet-500/50 hover:bg-zinc-800 active:scale-95"
                >
                  <Icone className="h-3 w-3 text-violet-400" />
                  <span>{s.texto}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Campo de Entrada de Mensagem */}
        <div className="border-t border-zinc-800/80 bg-zinc-950 p-3 pb-6 sm:p-4 sm:pb-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEnviar();
            }}
            className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500"
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
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white shadow-xs transition-all hover:bg-violet-500 active:scale-90 disabled:opacity-30"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-zinc-500">
            Claude pode agendar, desmarcar, checar cobranças e dar baixa em pagamentos.
          </p>
        </div>
      </div>
    </>
  );
}
