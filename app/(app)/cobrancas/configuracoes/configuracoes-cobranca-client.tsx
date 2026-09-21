"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfigCobranca } from "@/lib/services/cobrancas";
import { acaoSalvarConfiguracoesCobranca } from "../actions";
import { preencherTemplateMensagem } from "@/lib/services/whatsapp-cobranca";
import { type Plano, calcularPlanoTrimestral } from "@/lib/planos-calculo";
import {
  atualizarPlano,
  alternarPlanoAtivo,
} from "@/lib/services/planos";
import { showToast } from "@/components/toast";
import { dataHoje } from "@/lib/constantes";
import {
  ArrowLeft,
  QrCode,
  Save,
  MessageSquare,
  RotateCcw,
  Loader2,
  CheckCheck,
  Dumbbell,
  Tag,
  Check,
  Percent,
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
  planosInicial?: Plano[];
};

export function ConfiguracoesCobrancaClient({
  configInicial,
  planosInicial = [],
}: Props) {
  const router = useRouter();
  const hoje = dataHoje();

  // Aba principal
  const [abaPrincipal, setAbaPrincipal] = useState<"planos" | "pix">("planos");

  // Estados dos campos de cobrança/pix
  const [chavePix, setChavePix] = useState(configInicial.chave_pix);
  const [studioNome, setStudioNome] = useState(configInicial.studio_nome || "Studio Brenno Mancini");
  const [msgAntecipada, setMsgAntecipada] = useState(configInicial.msg_antecipada);
  const [msgHoje, setMsgHoje] = useState(configInicial.msg_hoje);
  const [msgAtraso, setMsgAtraso] = useState(configInicial.msg_atraso);

  // Aba ativa de edição de template
  const [abaTemplate, setAbaTemplate] = useState<"hoje" | "atraso" | "antecipada">("hoje");
  const [salvando, setSalvando] = useState(false);

  // Estados dos planos
  const [planos, setPlanos] = useState<Plano[]>(planosInicial);
  const [precosEditados, setPrecosEditados] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const p of planosInicial) {
      map[p.id] = p.preco_mensal ? String(p.preco_mensal) : "";
    }
    return map;
  });
  const [salvandoPlanoId, setSalvandoPlanoId] = useState<string | null>(null);

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

  function inserirVariavel(variavel: string) {
    setTemplateAtual(`${templateAtual} ${variavel}`);
  }

  function restaurarPadrao() {
    if (abaTemplate === "hoje") setMsgHoje(TEMPLATES_PADRAO.msg_hoje);
    else if (abaTemplate === "atraso") setMsgAtraso(TEMPLATES_PADRAO.msg_atraso);
    else setMsgAntecipada(TEMPLATES_PADRAO.msg_antecipada);
    showToast("Modelo restaurado para o padrão sugerido.", "info");
  }

  const previaMensagem = preencherTemplateMensagem({
    nomeAluno: "Lucas Ferreira",
    valor: 349.90,
    dataVencimento: hoje,
    chavePix: chavePix || "(sua chave Pix cadastrada acima)",
    studioNome: studioNome || "Studio Brenno Mancini",
    template: templateAtual,
  });

  async function handleSalvarPix(e: React.FormEvent) {
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

  async function handleSalvarPrecoPlano(plano: Plano) {
    const precoRaw = precosEditados[plano.id]?.trim().replace(",", ".");
    const precoNovo = parseFloat(precoRaw);
    if (isNaN(precoNovo) || precoNovo <= 0) {
      showToast("Informe um valor válido maior que zero.", "error");
      return;
    }

    setSalvandoPlanoId(plano.id);
    try {
      const res = await atualizarPlano(plano.id, { preco_mensal: precoNovo });
      if (res.error) {
        showToast(res.error, "error");
      } else {
        showToast(`Plano ${plano.nome} atualizado para R$ ${precoNovo.toFixed(2).replace(".", ",")}!`, "success");
        setPlanos((prev) =>
          prev.map((p) => (p.id === plano.id ? { ...p, preco_mensal: precoNovo } : p))
        );
        router.refresh();
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao atualizar plano", "error");
    } finally {
      setSalvandoPlanoId(null);
    }
  }

  async function handleToggleAtivo(plano: Plano) {
    try {
      await alternarPlanoAtivo(plano.id, plano.ativo);
      setPlanos((prev) =>
        prev.map((p) => (p.id === plano.id ? { ...p, ativo: !p.ativo } : p))
      );
      showToast(`Plano ${plano.nome} ${!plano.ativo ? "ativado" : "desativado"}.`, "info");
      router.refresh();
    } catch {
      showToast("Erro ao alternar status do plano.", "error");
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
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
            Configurações do Studio
          </h1>
          <p className="text-xs text-zinc-400">
            Gerencie os planos de treino, chave Pix e modelos de cobrança
          </p>
        </div>
      </div>

      {/* Tabs Principais */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-900/80 border border-white/10">
        <button
          type="button"
          onClick={() => setAbaPrincipal("planos")}
          className={`h-11 min-h-[44px] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            abaPrincipal === "planos"
              ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Dumbbell className="h-4 w-4" />
          <span>Planos & Valores (1x a 5x)</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaPrincipal("pix")}
          className={`h-11 min-h-[44px] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            abaPrincipal === "pix"
              ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <QrCode className="h-4 w-4" />
          <span>Pix & WhatsApp</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* ABA 1: PLANOS DO STUDIO */}
      {/* ========================================================= */}
      {abaPrincipal === "planos" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-4 text-xs text-emerald-300 flex flex-col gap-1.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-emerald-400" />
              Tabela Oficial de Atendimento e Treinamento Personalizado
            </span>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Defina o preço mensal de cada frequência semanal. O sistema calcula automaticamente o <strong>Plano Trimestral com 5% de desconto</strong> no valor total dos 3 meses.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {planos.map((plano) => {
              const precoAtual = parseFloat(
                precosEditados[plano.id]?.replace(",", ".") || String(plano.preco_mensal || 0)
              );
              const calcTrimestral = calcularPlanoTrimestral(precoAtual > 0 ? precoAtual : (plano.preco_mensal || 0));
              const estaSalvando = salvandoPlanoId === plano.id;

              return (
                <div
                  key={plano.id}
                  className={`flex flex-col gap-3 rounded-2xl border p-4 transition-all ${
                    plano.ativo
                      ? "border-white/10 bg-zinc-900/80 hover:border-white/20"
                      : "border-white/5 bg-zinc-900/40 opacity-60"
                  }`}
                >
                  {/* Cabeçalho do Plano */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-sm">
                        {plano.frequencia_semanal}x
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{plano.nome}</h3>
                        <p className="text-[11px] text-zinc-400">
                          {plano.frequencia_semanal} atendimento{plano.frequencia_semanal! > 1 ? "s" : ""} por semana
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleAtivo(plano)}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold border transition-colors cursor-pointer ${
                        plano.ativo
                          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                          : "border-white/10 bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {plano.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </div>

                  {/* Edição do Preço Mensal */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-zinc-300">
                        Preço Mensal (R$)
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        value={precosEditados[plano.id] ?? ""}
                        onChange={(e) =>
                          setPrecosEditados((prev) => ({ ...prev, [plano.id]: e.target.value }))
                        }
                        className="h-11 rounded-xl border border-white/10 bg-zinc-950 px-3 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={estaSalvando}
                      onClick={() => handleSalvarPrecoPlano(plano)}
                      className="btn-press mt-5 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {estaSalvando ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>Salvar</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Opção Trimestral Calculada Automaticamente */}
                  <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-3 flex flex-col gap-1 text-[11px]">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-zinc-300 flex items-center gap-1">
                        <Percent className="h-3 w-3 text-emerald-400" />
                        Opção Trimestral (5% desc.):
                      </span>
                      <span className="text-emerald-300 font-extrabold text-xs">
                        R$ {calcTrimestral.totalTrimestral.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Economia: R$ {calcTrimestral.economia.toFixed(2).replace(".", ",")}</span>
                      <span>Equivale a R$ {calcTrimestral.equivalentePorMes.toFixed(2).replace(".", ",")}/mês</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 2: CHAVE PIX & WHATSAPP */}
      {/* ========================================================= */}
      {abaPrincipal === "pix" && (
        <form onSubmit={handleSalvarPix} className="flex flex-col gap-5 animate-in fade-in duration-200">
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
                placeholder="Ex.: Studio Brenno Mancini"
                className="h-11 rounded-xl border border-white/10 bg-zinc-950 px-3.5 text-xs text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Card 2: Modelos de Mensagens */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900/80 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2 text-white">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-bold">Modelos de Mensagem do WhatsApp</h2>
              </div>
              <button
                type="button"
                onClick={restaurarPadrao}
                className="btn-press flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Restaurar Padrão</span>
              </button>
            </div>

            {/* Abas dos 3 Modelos */}
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-950 p-1">
              <button
                type="button"
                onClick={() => setAbaTemplate("hoje")}
                className={`rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  abaTemplate === "hoje"
                    ? "bg-zinc-800 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Vence Hoje
              </button>
              <button
                type="button"
                onClick={() => setAbaTemplate("atraso")}
                className={`rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  abaTemplate === "atraso"
                    ? "bg-zinc-800 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Atrasada
              </button>
              <button
                type="button"
                onClick={() => setAbaTemplate("antecipada")}
                className={`rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  abaTemplate === "antecipada"
                    ? "bg-zinc-800 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Antecipada
              </button>
            </div>

            {/* Variáveis Dinâmicas */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-zinc-400">
                Inserir Variável Dinâmica:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: "{primeiro_nome}", label: "Primeiro Nome" },
                  { tag: "{valor}", label: "Valor R$" },
                  { tag: "{vencimento}", label: "Vencimento" },
                  { tag: "{chave_pix}", label: "Chave Pix" },
                  { tag: "{studio_nome}", label: "Nome do Estúdio" },
                ].map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => inserirVariavel(v.tag)}
                    className="btn-press rounded-lg border border-white/10 bg-zinc-950 px-2 py-1 text-[10px] font-semibold text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 cursor-pointer"
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

            <div className="relative rounded-2xl bg-[#0b141a] p-4 border border-white/5 overflow-hidden">
              <div className="relative ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-[#005c4b] p-3 text-xs text-white shadow-md leading-relaxed whitespace-pre-wrap">
                {previaMensagem}
                <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-[#8696a0]">
                  <span>10:42</span>
                  <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Salvar Alterações de Pix e Mensagens */}
          <button
            type="submit"
            disabled={salvando}
            className="btn-press flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
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
      )}
    </div>
  );
}
