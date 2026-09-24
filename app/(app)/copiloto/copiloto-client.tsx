"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Calendar,
  CircleDollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
} from "lucide-react";
import { ClaudeIcon } from "@/components/icons/claude-icon";

type AcaoExecutada = {
  acao: string;
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

const MENSAGEM_INICIAL: MensagemItem = {
  id: "boas-vindas",
  role: "assistant",
  content:
    "Olá! Sou o seu Copiloto inteligente do **Studio Brenno Mancini**, alimentado pelo **Claude**.\n\nPosso consultar e marcar aulas, desmarcar alunos, verificar mensalidades atrasadas ou dar baixa em pagamentos. Como posso te ajudar agora?",
};

const SUGESTOES = [
  {
    icone: Calendar,
    texto: "Quem tem aula marcada hoje?",
  },
  {
    icone: CircleDollarSign,
    texto: "Quais mensalidades estão atrasadas?",
  },
  {
    icone: Clock,
    texto: "Quais são os horários de hoje?",
  },
  {
    icone: Users,
    texto: "Quantos alunos ativos temos?",
  },
];

const STORAGE_KEY = "studio_copiloto_historico_v2";

function carregarHistoricoLocal(): MensagemItem[] {
  try {
    const salvo =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (salvo) {
      const parsed = JSON.parse(salvo);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignora erro de parse local
  }
  return [MENSAGEM_INICIAL];
}

export function CopilotoClient() {
  const [mensagens, setMensagens] = useState<MensagemItem[]>(carregarHistoricoLocal);
  const [inputTexto, setInputTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const mensagensFimRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const idContadorRef = useRef(mensagens.length + 10);

  // Salva histórico no localStorage a cada alteração
  useEffect(() => {
    try {
      if (mensagens.length > 1) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mensagens));
      }
    } catch {
      // Ignora erro de quota
    }
  }, [mensagens]);

  // Rola para a mensagem mais recente
  useEffect(() => {
    mensagensFimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, carregando]);

  // Foco automático no input ao carregar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleLimparConversa() {
    localStorage.removeItem(STORAGE_KEY);
    idContadorRef.current += 1;
    setMensagens([
      {
        id: `boas-vindas-${idContadorRef.current}`,
        role: "assistant",
        content: "Conversa reiniciada. No que posso te ajudar agora?",
      },
    ]);
  }

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

    // Atualiza estado local imediatamente
    const mensagensAtualizadas = [...mensagens, novaMensagemUsuario];
    setMensagens(mensagensAtualizadas);
    setInputTexto("");
    setCarregando(true);

    try {
      // Monta histórico recente para o Claude (apenas 4 últimas mensagens para latência mínima)
      const historicoFormatado = mensagensAtualizadas.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/copiloto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagem: texto,
          historico: historicoFormatado,
        }),
      });

      const dados = await res.json();

      idContadorRef.current += 1;
      const novoIdAssistant = `assistant-${idContadorRef.current}`;

      if (res.ok && dados.ok) {
        setMensagens((prev) => [
          ...prev,
          {
            id: novoIdAssistant,
            role: "assistant",
            content: dados.resposta || "Ação concluída com sucesso.",
            acoes: dados.acoes || [],
          },
        ]);
      } else {
        setMensagens((prev) => [
          ...prev,
          {
            id: novoIdAssistant,
            role: "assistant",
            content:
              dados.resposta ||
              dados.erro ||
              "Não foi possível obter resposta do Claude no momento.",
            erro: true,
          },
        ]);
      }
    } catch {
      idContadorRef.current += 1;
      setMensagens((prev) => [
        ...prev,
        {
          id: `assistant-erro-${idContadorRef.current}`,
          role: "assistant",
          content: "Erro de conexão ao comunicar com o servidor do Copiloto.",
          erro: true,
        },
      ]);
    } finally {
      setCarregando(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] flex-col -mx-4 -my-5">
      {/* Cabeçalho do Copiloto */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-zinc-950/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#D97757]/30 to-[#EA8466]/20 border border-[#D97757]/40 text-[#EA8466] shadow-md shadow-[#D97757]/20">
            <ClaudeIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white">
                Copiloto Claude
              </h1>
              <span className="flex items-center gap-1 rounded-full border border-[#D97757]/30 bg-[#D97757]/15 px-2 py-0.5 text-[10px] font-semibold text-[#EA8466]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Operações de agenda, alunos e cobranças
            </p>
          </div>
        </div>

        <button
          onClick={handleLimparConversa}
          title="Reiniciar conversa"
          aria-label="Reiniciar conversa"
          className="btn-press flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:border-white/20 hover:text-zinc-200 active:scale-95 transition-all"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Nova conversa</span>
        </button>
      </div>

      {/* Sugestões rápidas de ações */}
      {mensagens.length <= 2 && !carregando && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-white/5 bg-zinc-900/30 px-4 py-2.5">
          {SUGESTOES.map((s, i) => {
            const Icone = s.icone;
            return (
              <button
                key={i}
                onClick={() => handleEnviar(s.texto)}
                className="btn-press flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-[#D97757]/50 hover:bg-[#D97757]/10 hover:text-white active:scale-95"
              >
                <Icone className="h-3.5 w-3.5 text-[#EA8466]" />
                <span>{s.texto}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Lista de Mensagens */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {mensagens.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {/* Balão de Mensagem */}
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "rounded-br-xs bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-950/40"
                  : m.erro
                  ? "rounded-bl-xs border border-rose-900/60 bg-rose-950/40 text-rose-200"
                  : "rounded-bl-xs border border-white/10 bg-zinc-900/90 text-zinc-200 shadow-black/20"
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{m.content}</div>
            </div>

            {/* Cartões visuais de ações executadas pelo Claude */}
            {m.acoes && m.acoes.length > 0 && (
              <div className="mt-2 w-full max-w-[88%] space-y-2">
                {m.acoes.map((acao, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 rounded-2xl border p-3 text-xs shadow-xs ${
                      acao.sucesso
                        ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-200"
                        : "border-amber-500/30 bg-amber-950/40 text-amber-200"
                    }`}
                  >
                    {acao.sucesso ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    )}
                    <div>
                      <div className="font-bold tracking-tight">{acao.titulo}</div>
                      <div className="mt-0.5 text-[11px] opacity-90 leading-relaxed">
                        {acao.detalhes}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Indicador de Carregando / Claude pensando */}
        {carregando && (
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#D97757]/20 border border-[#D97757]/40 text-[#EA8466]">
              <ClaudeIcon className="h-4 w-4 animate-pulse" />
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-xs border border-white/10 bg-zinc-900/90 px-4 py-3 text-xs text-zinc-300">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#EA8466] animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#EA8466] animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#EA8466] animate-bounce"></span>
              </div>
              <span className="text-zinc-400 font-medium">
                Claude operando o estúdio...
              </span>
            </div>
          </div>
        )}

        <div ref={mensagensFimRef} />
      </div>

      {/* Barra de entrada de texto inferior */}
      <div className="sticky bottom-0 border-t border-white/10 bg-zinc-950/95 p-3 backdrop-blur-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEnviar();
          }}
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/90 px-3 py-1.5 focus-within:border-[#D97757]/60 focus-within:ring-2 focus-within:ring-[#D97757]/20 transition-all"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputTexto}
            onChange={(e) => setInputTexto(e.target.value)}
            placeholder="Peça uma ação ou faça uma pergunta..."
            disabled={carregando}
            className="flex-1 bg-transparent py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={carregando || !inputTexto.trim()}
            aria-label="Enviar mensagem para o Copiloto Claude"
            className="btn-press flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-[#D97757] to-[#EA8466] text-zinc-950 font-bold shadow-md shadow-[#D97757]/30 transition-all hover:brightness-110 active:scale-90 disabled:opacity-30 disabled:hover:brightness-100"
          >
            {carregando ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
            ) : (
              <Send className="h-4 w-4 text-zinc-950" />
            )}
          </button>
        </form>
        <p className="mt-1.5 text-center text-[10px] text-zinc-500">
          Claude gerencia agenda, desmarca aulas e dá baixa em cobranças em tempo real.
        </p>
      </div>
    </div>
  );
}
