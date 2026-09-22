"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PainelCobrancas,
  CobrancaComAluno,
  ConfigCobranca,
  FormaPagamento,
} from "@/lib/services/cobrancas";
import {
  gerarLinkWhatsApp,
  formatarValorBRL,
  formatarDataBR,
} from "@/lib/services/whatsapp-cobranca";
import {
  acaoMarcarComoPago,
  acaoDesfazerPagamento,
  acaoRegistrarContatoWhatsApp,
  acaoCriarCobrancaAvulsa,
  acaoCancelarCobranca,
} from "./actions";
import { showToast } from "@/components/toast";
import { dataHoje } from "@/lib/constantes";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  MessageCircle,
  Settings,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  X,
  Loader2,
  DollarSign,
  PhoneCall,
  Trash2,
} from "lucide-react";

type CobrancasClientProps = {
  painelInicial: PainelCobrancas;
  config: ConfigCobranca;
  alunosAtivos: Array<{
    id: string;
    nome: string;
    telefone?: string | null;
    valor_mensalidade?: number | null;
    dia_vencimento?: number | null;
    plano_padrao_id?: string | null;
    periodicidade?: "mensal" | "trimestral";
  }>;
};

function calcularDiasDiferenca(dataVencimentoIso: string, hojeIso: string): number {
  const [a1, m1, d1] = dataVencimentoIso.split("-").map(Number);
  const [a2, m2, d2] = hojeIso.split("-").map(Number);
  const t1 = Date.UTC(a1, m1 - 1, d1);
  const t2 = Date.UTC(a2, m2 - 1, d2);
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

function formatarUltimoContato(ultimoContatoIso: string | null, qtd: number): string {
  if (!ultimoContatoIso || qtd === 0) return "Não cobrado";
  const agora = new Date();
  const data = new Date(ultimoContatoIso);
  const diffMs = agora.getTime() - data.getTime();
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHoras < 1) return `Cobrado há pouco (${qtd}x)`;
  if (diffHoras < 24) return `Cobrado há ${diffHoras}h (${qtd}x)`;
  const dias = Math.floor(diffHoras / 24);
  return `Cobrado há ${dias}d (${qtd}x)`;
}

export function CobrancasClient({
  painelInicial,
  config,
  alunosAtivos,
}: CobrancasClientProps) {
  const router = useRouter();
  const hoje = dataHoje();

  // Estados principais
  const [busca, setBusca] = useState("");
  const [filtroAba, setFiltroAba] = useState<"todas" | "atrasadas" | "hoje" | "proximos" | "pagas">("todas");
  const [expandirPagas, setExpandirPagas] = useState(false);

  // Estados de modais
  const [cobrancaParaPagar, setCobrancaParaPagar] = useState<CobrancaComAluno | null>(null);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("pix");
  const [dataPagamento, setDataPagamento] = useState(hoje);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);

  const [modalAvulsaAberto, setModalAvulsaAberto] = useState(false);
  const [processandoAvulsa, setProcessandoAvulsa] = useState(false);
  const [alunoAvulsaId, setAlunoAvulsaId] = useState("");
  const [tituloAvulsa, setTituloAvulsa] = useState("Cobrança avulsa");
  const [valorAvulsa, setValorAvulsa] = useState("");
  const [vencimentoAvulsa, setVencimentoAvulsa] = useState(hoje);

  const alunoAvulsaSelecionado = alunosAtivos.find((a) => a.id === alunoAvulsaId);

  const handleSelecionarAlunoAvulsa = (id: string) => {
    setAlunoAvulsaId(id);
    const aluno = alunosAtivos.find((a) => a.id === id);
    if (aluno) {
      if (aluno.valor_mensalidade) {
        setValorAvulsa(aluno.valor_mensalidade.toFixed(2));
      }
      if (aluno.periodicidade === "trimestral") {
        setTituloAvulsa("Trimestralidade");
      } else if (aluno.valor_mensalidade) {
        setTituloAvulsa("Mensalidade");
      }
      if (aluno.dia_vencimento) {
        const [ano, mes] = hoje.split("-").map(Number);
        const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
        const dia = Math.min(aluno.dia_vencimento, diasNoMes);
        setVencimentoAvulsa(`${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`);
      }
    }
  };

  const [desfazendoId, setDesfazendoId] = useState<string | null>(null);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);

  // Contatos locais otimistas
  const [contatosLocais, setContatosLocais] = useState<Record<string, { qtd: number; em: string }>>({});

  const [painel, setPainel] = useState<PainelCobrancas>(painelInicial);

  // Sincroniza se o servidor recarregar
  useEffect(() => {
    setPainel(painelInicial);
  }, [painelInicial]);

  const { totais, atrasadas, hoje: hojeLista, proximos, pagasMes } = painel;

  // Filtro de busca
  function filtrarPorBusca(lista: CobrancaComAluno[]) {
    if (!busca.trim()) return lista;
    const termo = busca.toLowerCase();
    return lista.filter(
      (c) =>
        c.aluno.nome.toLowerCase().includes(termo) ||
        (c.aluno.telefone && c.aluno.telefone.includes(termo)) ||
        c.titulo.toLowerCase().includes(termo)
    );
  }

  const atrasadasFiltradas = filtrarPorBusca(atrasadas);
  const hojeFiltradas = filtrarPorBusca(hojeLista);
  const proximosFiltrados = filtrarPorBusca(proximos);
  const pagasFiltradas = filtrarPorBusca(pagasMes);

  // Ao clicar em "Cobrar no WhatsApp"
  async function handleRegistrarContato(cobrancaId: string) {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    const atual = contatosLocais[cobrancaId] ?? {
      qtd: atrasadas.concat(hojeLista, proximos).find((c) => c.id === cobrancaId)?.qtd_contatos ?? 0,
      em: new Date().toISOString(),
    };
    setContatosLocais((prev) => ({
      ...prev,
      [cobrancaId]: { qtd: atual.qtd + 1, em: new Date().toISOString() },
    }));

    try {
      await acaoRegistrarContatoWhatsApp(cobrancaId);
    } catch {
      // Falha silenciosa em background sem travar o WhatsApp
    }
  }

  // Ao confirmar pagamento no modal (0ms feedback otimista)
  async function handleConfirmarPagamento(e: React.FormEvent) {
    e.preventDefault();
    if (!cobrancaParaPagar) return;

    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(12);
    }

    const cobrancaPaga: CobrancaComAluno = {
      ...cobrancaParaPagar,
      status: "pago",
      data_pagamento: dataPagamento,
      forma_pagamento: formaPagamento,
    };

    const valorPago = cobrancaPaga.valor;

    // 1) Feedback visual instantâneo: fecha modal e move card para Pagas
    setCobrancaParaPagar(null);
    showToast("Pagamento registrado! Próxima mensalidade agendada.", "success");

    setPainel((prev) => {
      const eraAtrasada = prev.atrasadas.some((c) => c.id === cobrancaPaga.id);
      const eraHoje = prev.hoje.some((c) => c.id === cobrancaPaga.id);
      const eraProximo = prev.proximos.some((c) => c.id === cobrancaPaga.id);

      return {
        ...prev,
        totais: {
          ...prev.totais,
          totalAtrasado: eraAtrasada ? Math.max(0, prev.totais.totalAtrasado - valorPago) : prev.totais.totalAtrasado,
          qtdAtrasado: eraAtrasada ? Math.max(0, prev.totais.qtdAtrasado - 1) : prev.totais.qtdAtrasado,
          totalHoje: eraHoje ? Math.max(0, prev.totais.totalHoje - valorPago) : prev.totais.totalHoje,
          qtdHoje: eraHoje ? Math.max(0, prev.totais.qtdHoje - 1) : prev.totais.qtdHoje,
          qtdProximos7Dias: eraProximo ? Math.max(0, prev.totais.qtdProximos7Dias - 1) : prev.totais.qtdProximos7Dias,
          totalRecebidoMes: prev.totais.totalRecebidoMes + valorPago,
          qtdRecebidoMes: prev.totais.qtdRecebidoMes + 1,
        },
        atrasadas: prev.atrasadas.filter((c) => c.id !== cobrancaPaga.id),
        hoje: prev.hoje.filter((c) => c.id !== cobrancaPaga.id),
        proximos: prev.proximos.filter((c) => c.id !== cobrancaPaga.id),
        pagasMes: [cobrancaPaga, ...prev.pagasMes],
      };
    });

    setProcessandoPagamento(true);
    try {
      const res = await acaoMarcarComoPago({
        cobrancaId: cobrancaPaga.id,
        formaPagamento,
        dataPagamento,
      });

      if (res.error) {
        showToast(res.error, "error");
        setPainel(painelInicial); // reverte em caso de erro
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao processar pagamento", "error");
      setPainel(painelInicial);
    } finally {
      setProcessandoPagamento(false);
    }
  }

  // Desfazer pagamento
  async function handleDesfazerPagamento(cobrancaId: string) {
    if (!confirm("Deseja realmente desfazer este pagamento e retornar a cobrança para pendente?")) {
      return;
    }

    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }

    setDesfazendoId(cobrancaId);
    try {
      const res = await acaoDesfazerPagamento(cobrancaId);
      if (res.error) {
        showToast(res.error, "error");
      } else {
        showToast("Pagamento desfeito com sucesso.", "info");
        router.refresh();
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao desfazer", "error");
    } finally {
      setDesfazendoId(null);
    }
  }

  // Excluir ou cancelar cobrança (0ms feedback otimista)
  async function handleCancelarCobranca(cobrancaId: string) {
    if (!confirm("Tem certeza que deseja excluir esta cobrança?")) return;

    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([12, 25]);
    }

    // 1) Feedback visual instantâneo: remove da tela e recalcula totais em 0ms
    setPainel((prev) => {
      const eraAtrasada = prev.atrasadas.find((c) => c.id === cobrancaId);
      const eraHoje = prev.hoje.find((c) => c.id === cobrancaId);
      const eraProximo = prev.proximos.find((c) => c.id === cobrancaId);
      const valor = (eraAtrasada || eraHoje || eraProximo)?.valor ?? 0;

      return {
        ...prev,
        totais: {
          ...prev.totais,
          totalAtrasado: eraAtrasada ? Math.max(0, prev.totais.totalAtrasado - valor) : prev.totais.totalAtrasado,
          qtdAtrasado: eraAtrasada ? Math.max(0, prev.totais.qtdAtrasado - 1) : prev.totais.qtdAtrasado,
          totalHoje: eraHoje ? Math.max(0, prev.totais.totalHoje - valor) : prev.totais.totalHoje,
          qtdHoje: eraHoje ? Math.max(0, prev.totais.qtdHoje - 1) : prev.totais.qtdHoje,
          qtdProximos7Dias: eraProximo ? Math.max(0, prev.totais.qtdProximos7Dias - 1) : prev.totais.qtdProximos7Dias,
        },
        atrasadas: prev.atrasadas.filter((c) => c.id !== cobrancaId),
        hoje: prev.hoje.filter((c) => c.id !== cobrancaId),
        proximos: prev.proximos.filter((c) => c.id !== cobrancaId),
      };
    });

    showToast("Cobrança excluída com sucesso!", "success");

    setCancelandoId(cobrancaId);
    try {
      const res = await acaoCancelarCobranca(cobrancaId);
      if (res.error) {
        showToast(res.error, "error");
        setPainel(painelInicial);
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao excluir cobrança", "error");
      setPainel(painelInicial);
    } finally {
      setCancelandoId(null);
    }
  }

  // Salvar cobrança avulsa
  async function handleSalvarAvulsa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProcessandoAvulsa(true);

    const formData = new FormData(e.currentTarget);
    const alunoId = String(formData.get("aluno_id") ?? "").trim();
    const titulo = String(formData.get("titulo") ?? "").trim();
    const valorRaw = String(formData.get("valor") ?? "").trim().replace(",", ".");
    const dataVencimento = String(formData.get("data_vencimento") ?? "").trim();
    const observacao = String(formData.get("observacao") ?? "").trim();

    const valor = parseFloat(valorRaw);

    if (!alunoId) {
      showToast("Por favor, selecione um aluno.", "error");
      setProcessandoAvulsa(false);
      return;
    }

    if (isNaN(valor) || valor <= 0) {
      showToast("Informe um valor válido maior que zero.", "error");
      setProcessandoAvulsa(false);
      return;
    }

    if (!dataVencimento) {
      showToast("Informe a data de vencimento.", "error");
      setProcessandoAvulsa(false);
      return;
    }

    try {
      const res = await acaoCriarCobrancaAvulsa({
        alunoId,
        titulo: titulo || "Cobrança avulsa",
        valor,
        dataVencimento,
        observacao,
      });

      if (!res.ok) {
        showToast(res.error || "Erro ao salvar cobrança", "error");
      } else {
        showToast("Cobrança avulsa lançada com sucesso!", "success");
        setModalAvulsaAberto(false);
        router.refresh();
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao criar cobrança", "error");
    } finally {
      setProcessandoAvulsa(false);
    }
  }

  // Renderizador de um card de cobrança pendente
  function renderCardCobranca(
    cobranca: CobrancaComAluno,
    tipo: "atrasada" | "hoje" | "proximo"
  ) {
    const contatoInfo = contatosLocais[cobranca.id] ?? {
      qtd: cobranca.qtd_contatos,
      em: cobranca.ultimo_contato_em,
    };

    // Escolhe o template conforme o momento
    const template =
      tipo === "atrasada"
        ? config.msg_atraso
        : tipo === "hoje"
        ? config.msg_hoje
        : config.msg_antecipada;

    const linkWa = gerarLinkWhatsApp(cobranca.aluno.telefone, {
      nomeAluno: cobranca.aluno.nome,
      valor: cobranca.valor,
      dataVencimento: cobranca.data_vencimento,
      chavePix: config.chave_pix,
      studioNome: config.studio_nome,
      template,
    });

    const diasAtraso = tipo === "atrasada" ? calcularDiasDiferenca(cobranca.data_vencimento, hoje) : 0;
    const diasProximo = tipo === "proximo" ? -calcularDiasDiferenca(cobranca.data_vencimento, hoje) : 0;

    return (
      <div
        key={cobranca.id}
        className={`group relative flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-200 ${
          tipo === "atrasada"
            ? "border-rose-500/25 bg-gradient-to-b from-rose-950/20 to-zinc-900/90 shadow-lg shadow-rose-950/20"
            : tipo === "hoje"
            ? "border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-zinc-900/90 shadow-lg shadow-amber-950/20"
            : "border-white/10 bg-zinc-900/80 hover:border-white/20"
        }`}
      >
        {/* Linha superior: Nome do aluno + Tag de vencimento */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/alunos/${cobranca.aluno.id}`}
              className="text-sm font-bold text-white hover:text-emerald-400 transition-colors"
            >
              {cobranca.aluno.nome}
            </Link>
            <span className="text-[11px] text-zinc-400">
              {cobranca.titulo} • Vencimento: {formatarDataBR(cobranca.data_vencimento)}
            </span>
          </div>

          {/* Badge de prazo */}
          {tipo === "atrasada" && (
            <span className="shrink-0 rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
              {diasAtraso === 1 ? "Atrasado há 1 dia" : `Atrasado há ${diasAtraso} dias`}
            </span>
          )}
          {tipo === "hoje" && (
            <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 animate-pulse">
              Vence hoje
            </span>
          )}
          {tipo === "proximo" && (
            <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-0.5 text-[10px] font-medium text-zinc-300">
              {diasProximo === 1 ? "Amanhã" : `Em ${diasProximo} dias`}
            </span>
          )}
        </div>

        {/* Linha do meio: Valor e Status de contato */}
        <div className="flex items-center justify-between border-y border-white/5 py-2.5">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Valor
            </span>
            <span className="text-lg font-extrabold tracking-tight text-white">
              R$ {formatarValorBRL(cobranca.valor)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-zinc-950/60 px-2.5 py-1 text-[11px] text-zinc-400">
            <PhoneCall className="h-3 w-3 text-zinc-500" />
            <span>{formatarUltimoContato(contatoInfo.em, contatoInfo.qtd)}</span>
          </div>
        </div>

        {/* Linha inferior: Ações rápidas (Cobrar no WhatsApp e Marcar Pago) */}
        <div className="flex items-center gap-2 pt-0.5">
          {/* Botão nativo WhatsApp (link direto wa.me para nunca travar no Safari do iPhone) */}
          {linkWa.telefoneValido && linkWa.url ? (
            <a
              href={linkWa.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleRegistrarContato(cobranca.id)}
              className="btn-press flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-colors"
            >
              <MessageCircle className="h-4 w-4 stroke-[2.5]" />
              <span>Cobrar WhatsApp</span>
            </a>
          ) : (
            <button
              disabled
              title="Aluno sem telefone cadastrado"
              className="flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-zinc-800/60 px-3 py-2.5 text-xs font-medium text-zinc-500"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Sem WhatsApp</span>
            </button>
          )}

          {/* Botão Marcar como Pago */}
          <button
            onClick={() => {
              setCobrancaParaPagar(cobranca);
              setDataPagamento(hoje);
              setFormaPagamento("pix");
            }}
            className="btn-press flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-zinc-800/90 px-3.5 py-2.5 text-xs font-semibold text-white hover:border-emerald-500/40 hover:bg-zinc-800 transition-all"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Pago</span>
          </button>

          {/* Cancelar ou excluir cobrança */}
          <button
            onClick={() => handleCancelarCobranca(cobranca.id)}
            disabled={cancelandoId === cobranca.id}
            title="Excluir esta cobrança"
            className="btn-press flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/60 text-zinc-500 hover:border-red-500/30 hover:text-red-400 transition-colors"
          >
            {cancelandoId === cobranca.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 1) Cabeçalho com ações */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Cobranças</h1>
          <p className="text-xs text-zinc-400">
            Controle de mensalidades e cobrança via WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalAvulsaAberto(true)}
            className="btn-press flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-3 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-500/20 hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>+ Avulsa</span>
          </button>

          <Link
            href="/cobrancas/configuracoes"
            title="Configurar chave Pix e mensagens"
            className="btn-press flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/70 text-zinc-300 hover:text-white"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* 2) Cards de Resumo Financeiro (Atrasado, Vence Hoje, Recebido no Mês) */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Card Atrasadas */}
        <button
          onClick={() => setFiltroAba(filtroAba === "atrasadas" ? "todas" : "atrasadas")}
          className={`flex flex-col rounded-2xl border p-3 text-left transition-all ${
            filtroAba === "atrasadas"
              ? "border-rose-500 bg-rose-950/40 ring-1 ring-rose-500/50"
              : "border-rose-500/20 bg-rose-950/15 hover:border-rose-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Atrasado</span>
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <span className="mt-1 text-sm font-extrabold text-rose-200">
            R$ {formatarValorBRL(totais.totalAtrasado)}
          </span>
          <span className="mt-0.5 text-[10px] text-rose-300/80">
            {totais.qtdAtrasado} {totais.qtdAtrasado === 1 ? "aluno" : "alunos"}
          </span>
        </button>

        {/* Card Vencem Hoje */}
        <button
          onClick={() => setFiltroAba(filtroAba === "hoje" ? "todas" : "hoje")}
          className={`flex flex-col rounded-2xl border p-3 text-left transition-all ${
            filtroAba === "hoje"
              ? "border-amber-500 bg-amber-950/40 ring-1 ring-amber-500/50"
              : "border-amber-500/20 bg-amber-950/15 hover:border-amber-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Hoje</span>
            <Clock className="h-3.5 w-3.5" />
          </div>
          <span className="mt-1 text-sm font-extrabold text-amber-200">
            R$ {formatarValorBRL(totais.totalHoje)}
          </span>
          <span className="mt-0.5 text-[10px] text-amber-300/80">
            {totais.qtdHoje} {totais.qtdHoje === 1 ? "aluno" : "alunos"}
          </span>
        </button>

        {/* Card Recebido no Mês */}
        <button
          onClick={() => setFiltroAba(filtroAba === "pagas" ? "todas" : "pagas")}
          className={`flex flex-col rounded-2xl border p-3 text-left transition-all ${
            filtroAba === "pagas"
              ? "border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500/50"
              : "border-emerald-500/20 bg-emerald-950/15 hover:border-emerald-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Recebido</span>
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <span className="mt-1 text-sm font-extrabold text-emerald-200">
            R$ {formatarValorBRL(totais.totalRecebidoMes)}
          </span>
          <span className="mt-0.5 text-[10px] text-emerald-300/80">
            {totais.qtdRecebidoMes} pagas
          </span>
        </button>
      </div>

      {/* 3) Campo de Busca e Abas Rápidas */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar aluno ou cobrança..."
            className="h-10 w-full rounded-xl border border-white/10 bg-zinc-900/80 pl-10 pr-4 text-xs text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Abas de filtro */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setFiltroAba("todas")}
            className={`rounded-xl px-3 py-1.5 font-medium transition-all ${
              filtroAba === "todas"
                ? "bg-zinc-100 text-zinc-950 font-bold"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Todas ({atrasadas.length + hojeLista.length + proximos.length})
          </button>
          <button
            onClick={() => setFiltroAba("atrasadas")}
            className={`rounded-xl px-3 py-1.5 font-medium transition-all ${
              filtroAba === "atrasadas"
                ? "bg-rose-500 text-white font-bold"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Atrasadas ({atrasadas.length})
          </button>
          <button
            onClick={() => setFiltroAba("hoje")}
            className={`rounded-xl px-3 py-1.5 font-medium transition-all ${
              filtroAba === "hoje"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Vencem hoje ({hojeLista.length})
          </button>
          <button
            onClick={() => setFiltroAba("proximos")}
            className={`rounded-xl px-3 py-1.5 font-medium transition-all ${
              filtroAba === "proximos"
                ? "bg-zinc-200 text-zinc-950 font-bold"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Próximos 7d ({proximos.length})
          </button>
          <button
            onClick={() => setFiltroAba("pagas")}
            className={`rounded-xl px-3 py-1.5 font-medium transition-all ${
              filtroAba === "pagas"
                ? "bg-emerald-500 text-zinc-950 font-bold"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Pagas ({pagasMes.length})
          </button>
        </div>
      </div>

      {/* 4) Seção 1: ATRASADAS */}
      {(filtroAba === "todas" || filtroAba === "atrasadas") && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <h2 className="text-sm font-bold tracking-tight text-white">
                Atrasadas ({atrasadasFiltradas.length})
              </h2>
            </div>
            {atrasadasFiltradas.length > 0 && (
              <span className="text-xs font-semibold text-rose-400">
                Total: R$ {formatarValorBRL(totais.totalAtrasado)}
              </span>
            )}
          </div>

          {atrasadasFiltradas.length === 0 ? (
            filtroAba === "atrasadas" ? (
              <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 text-center text-xs text-zinc-400">
                Nenhuma cobrança atrasada encontrada. 🎉
              </div>
            ) : null
          ) : (
            atrasadasFiltradas.map((c) => renderCardCobranca(c, "atrasada"))
          )}
        </div>
      )}

      {/* 5) Seção 2: VENCEM HOJE */}
      {(filtroAba === "todas" || filtroAba === "hoje") && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-400" />
              <h2 className="text-sm font-bold tracking-tight text-white">
                Vencem Hoje ({hojeFiltradas.length})
              </h2>
            </div>
            {hojeFiltradas.length > 0 && (
              <span className="text-xs font-semibold text-amber-400">
                Total: R$ {formatarValorBRL(totais.totalHoje)}
              </span>
            )}
          </div>

          {hojeFiltradas.length === 0 ? (
            filtroAba === "hoje" ? (
              <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 text-center text-xs text-zinc-400">
                Nenhum vencimento programado para hoje.
              </div>
            ) : null
          ) : (
            hojeFiltradas.map((c) => renderCardCobranca(c, "hoje"))
          )}
        </div>
      )}

      {/* 6) Seção 3: PRÓXIMOS 7 DIAS */}
      {(filtroAba === "todas" || filtroAba === "proximos") && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <h2 className="text-sm font-bold tracking-tight text-white">
                Próximos 7 Dias ({proximosFiltrados.length})
              </h2>
            </div>
          </div>

          {proximosFiltrados.length === 0 ? (
            filtroAba === "proximos" ? (
              <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 text-center text-xs text-zinc-400">
                Nenhuma cobrança para os próximos 7 dias.
              </div>
            ) : null
          ) : (
            proximosFiltrados.map((c) => renderCardCobranca(c, "proximo"))
          )}
        </div>
      )}

      {/* 7) Seção 4: PAGAS NESTE MÊS (Recolhível ou direto na aba) */}
      {(filtroAba === "todas" || filtroAba === "pagas") && (
        <div className="flex flex-col gap-3">
          {filtroAba === "todas" ? (
            <button
              onClick={() => setExpandirPagas(!expandirPagas)}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-xs font-semibold text-zinc-300 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Pagas neste mês ({pagasFiltradas.length})</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="font-bold text-emerald-400">
                  R$ {formatarValorBRL(totais.totalRecebidoMes)}
                </span>
                {expandirPagas ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-bold tracking-tight text-white">
                  Pagas neste Mês ({pagasFiltradas.length})
                </h2>
              </div>
              <span className="text-xs font-semibold text-emerald-400">
                Total: R$ {formatarValorBRL(totais.totalRecebidoMes)}
              </span>
            </div>
          )}

          {(filtroAba === "pagas" || expandirPagas) && (
            <div className="flex flex-col gap-2.5">
              {pagasFiltradas.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 text-center text-xs text-zinc-400">
                  Nenhum pagamento registrado neste mês ainda.
                </div>
              ) : (
                pagasFiltradas.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-zinc-900/60 p-3.5 text-xs transition-all"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-white">{c.aluno.nome}</span>
                      <span className="text-[11px] text-zinc-400">
                        {c.titulo} • Pago em {formatarDataBR(c.data_pagamento || c.data_vencimento)}
                        {c.forma_pagamento ? ` (${c.forma_pagamento.toUpperCase()})` : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-emerald-400">
                        R$ {formatarValorBRL(c.valor)}
                      </span>

                      <button
                        onClick={() => handleDesfazerPagamento(c.id)}
                        disabled={desfazendoId === c.id}
                        title="Desfazer pagamento e voltar para pendente"
                        className="btn-press flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-800/80 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:text-white"
                      >
                        {desfazendoId === c.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        <span>Desfazer</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Marcar Como Pago */}
      {cobrancaParaPagar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-zinc-950 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-white">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Confirmar Pagamento</h3>
              </div>
              <button
                onClick={() => setCobrancaParaPagar(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmarPagamento} className="mt-4 flex flex-col gap-4">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3">
                <div className="text-xs text-zinc-300">
                  Aluno: <strong className="text-white">{cobrancaParaPagar.aluno.nome}</strong>
                </div>
                <div className="mt-1 text-sm font-extrabold text-emerald-400">
                  R$ {formatarValorBRL(cobrancaParaPagar.valor)}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "pix", label: "Pix" },
                      { id: "dinheiro", label: "Dinheiro" },
                      { id: "cartao_credito", label: "Crédito" },
                      { id: "cartao_debito", label: "Débito" },
                      { id: "outro", label: "Outro" },
                    ] as const
                  ).map((forma) => (
                    <button
                      key={forma.id}
                      type="button"
                      onClick={() => setFormaPagamento(forma.id)}
                      className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                        formaPagamento === forma.id
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold"
                          : "border-white/10 bg-zinc-900 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {forma.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Data do Pagamento
                </label>
                <input
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  className="h-10 rounded-xl border border-white/10 bg-zinc-900 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-zinc-500 leading-relaxed">
                ℹ️ Ao confirmar, o status passa a ser <strong>pago</strong> e a mensalidade do próximo mês será agendada automaticamente.
              </p>

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCobrancaParaPagar(null)}
                  className="flex-1 rounded-xl border border-white/10 bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processandoPagamento}
                  className="btn-press flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-500/20 hover:brightness-110"
                >
                  {processandoPagamento ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Confirmar Pago</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nova Cobrança Avulsa */}
      {modalAvulsaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-zinc-950 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-white">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Lançar Cobrança Avulsa</h3>
              </div>
              <button
                onClick={() => setModalAvulsaAberto(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarAvulsa} className="mt-4 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Aluno *
                </label>
                <select
                  name="aluno_id"
                  required
                  value={alunoAvulsaId}
                  onChange={(e) => handleSelecionarAlunoAvulsa(e.target.value)}
                  className="h-10 rounded-xl border border-white/10 bg-zinc-900 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Selecione o aluno...</option>
                  {alunosAtivos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} {a.valor_mensalidade ? `(R$ ${a.valor_mensalidade.toFixed(2).replace(".", ",")})` : ""}
                    </option>
                  ))}
                </select>

                {alunoAvulsaSelecionado && alunoAvulsaSelecionado.valor_mensalidade && (
                  <div className="mt-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2 text-[11px] text-emerald-300 animate-in fade-in duration-150">
                    ✨ Dados puxados do plano: <strong>R$ {alunoAvulsaSelecionado.valor_mensalidade.toFixed(2).replace(".", ",")}</strong> ({alunoAvulsaSelecionado.periodicidade === "trimestral" ? "Trimestral" : "Mensal"} · dia {alunoAvulsaSelecionado.dia_vencimento})
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Título / Motivo *
                </label>
                <input
                  type="text"
                  name="titulo"
                  required
                  value={tituloAvulsa}
                  onChange={(e) => setTituloAvulsa(e.target.value)}
                  placeholder="Ex.: Mensalidade, Trimestralidade, Matrícula"
                  className="h-10 rounded-xl border border-white/10 bg-zinc-900 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    name="valor"
                    required
                    value={valorAvulsa}
                    onChange={(e) => setValorAvulsa(e.target.value)}
                    placeholder="0,00"
                    className="h-10 rounded-xl border border-white/10 bg-zinc-900 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Vencimento *
                  </label>
                  <input
                    type="date"
                    name="data_vencimento"
                    required
                    value={vencimentoAvulsa}
                    onChange={(e) => setVencimentoAvulsa(e.target.value)}
                    className="h-10 rounded-xl border border-white/10 bg-zinc-900 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Observações (opcional)
                </label>
                <textarea
                  name="observacao"
                  rows={2}
                  placeholder="Ex.: Pago referente ao evento X"
                  className="rounded-xl border border-white/10 bg-zinc-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalAvulsaAberto(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processandoAvulsa}
                  className="btn-press flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-500/20 hover:brightness-110"
                >
                  {processandoAvulsa ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Salvar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
