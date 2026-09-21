"use server";

import { exigeDono } from "@/lib/exige-login";
import { dataHoje } from "@/lib/constantes";
import { revalidatePath } from "next/cache";

export type StatusCobranca = "pendente" | "pago" | "cancelado";
export type FormaPagamento = "pix" | "dinheiro" | "cartao_credito" | "cartao_debito" | "outro";
export type TipoCobranca = "recorrente" | "avulsa";

export type Cobranca = {
  id: string;
  aluno_id: string;
  plano_id: string | null;
  titulo: string;
  valor: number;
  data_vencimento: string; // YYYY-MM-DD
  status: StatusCobranca;
  data_pagamento: string | null; // YYYY-MM-DD
  forma_pagamento: FormaPagamento | null;
  observacao: string;
  tipo: TipoCobranca;
  ultimo_contato_em: string | null;
  qtd_contatos: number;
  mes_referencia: string | null; // YYYY-MM
  created_at: string;
  updated_at: string;
};

export type CobrancaComAluno = Cobranca & {
  aluno: {
    id: string;
    nome: string;
    telefone: string | null;
    valor_mensalidade: number | null;
    dia_vencimento: number | null;
  };
};

export type TotaisCobrancas = {
  totalAtrasado: number;
  qtdAtrasado: number;
  totalHoje: number;
  qtdHoje: number;
  totalRecebidoMes: number;
  qtdRecebidoMes: number;
  qtdProximos7Dias: number;
};

export type PainelCobrancas = {
  totais: TotaisCobrancas;
  atrasadas: CobrancaComAluno[];
  hoje: CobrancaComAluno[];
  proximos: CobrancaComAluno[];
  pagasMes: CobrancaComAluno[];
};

export type ConfigCobranca = {
  chave_pix: string;
  studio_nome: string;
  msg_antecipada: string;
  msg_hoje: string;
  msg_atraso: string;
};

const CONFIG_PADRAO: ConfigCobranca = {
  chave_pix: "",
  studio_nome: "Studio Brenno Mancini",
  msg_antecipada:
    "Olá, {primeiro_nome}! Passando para lembrar que sua mensalidade do Studio Brenno Mancini no valor de R$ {valor} vence no dia {vencimento}. Chave Pix: {chave_pix}. Qualquer dúvida, me avise!",
  msg_hoje:
    "Olá, {primeiro_nome}! Sua mensalidade do Studio Brenno Mancini no valor de R$ {valor} vence hoje ({vencimento}). Segue a chave Pix para pagamento: {chave_pix}. Obrigado!",
  msg_atraso:
    "Olá, {primeiro_nome}, tudo bem? Não identificamos o pagamento da sua mensalidade do Studio Brenno Mancini no valor de R$ {valor}, vencida em {vencimento}. Segue nossa chave Pix: {chave_pix}. Caso já tenha pago, por favor desconsidere!",
};

/**
 * Calcula a data de vencimento do mês subsequente respeitando a quantidade de dias do mês.
 * Se o aluno tem dia fixo (ex.: dia 31), em fevereiro ajusta para 28 ou 29, mas preserva
 * o dia 31 como âncora para os meses seguintes.
 */
export async function calcularProximoVencimento(
  dataVencimentoIso: string,
  diaPadrao?: number | null,
  periodicidade: "mensal" | "trimestral" = "mensal"
): Promise<string> {
  const partes = dataVencimentoIso.split("-").map(Number);
  const ano = partes[0];
  const mes = partes[1]; // 1 a 12
  const diaOriginal = partes[2];

  const incremento = periodicidade === "trimestral" ? 3 : 1;
  let proxAno = ano;
  let proxMes = mes + incremento;
  while (proxMes > 12) {
    proxMes -= 12;
    proxAno += 1;
  }

  // Descobre quantos dias existem no próximo mês (passando 0 no dia do mês seguinte)
  const diasNoProxMes = new Date(Date.UTC(proxAno, proxMes, 0)).getUTCDate();
  const diaAlvo = diaPadrao && diaPadrao >= 1 && diaPadrao <= 31 ? diaPadrao : diaOriginal;
  const diaEfetivo = Math.min(diaAlvo, diasNoProxMes);

  return `${proxAno}-${String(proxMes).padStart(2, "0")}-${String(diaEfetivo).padStart(2, "0")}`;
}

/**
 * Retorna a data no formato YYYY-MM-DD acrescida de N dias.
 */
function somarDiasData(dataIso: string, dias: number): string {
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia + dias));
  const a = data.getUTCFullYear();
  const m = String(data.getUTCMonth() + 1).padStart(2, "0");
  const d = String(data.getUTCDate()).padStart(2, "0");
  return `${a}-${m}-${d}`;
}

/**
 * Obtém as configurações de mensagens e chave Pix da tabela public.config.
 */
export async function obterConfiguracoesCobranca(): Promise<ConfigCobranca> {
  const supabase = await exigeDono();
  const { data } = await supabase
    .from("config")
    .select("chave, valor")
    .in("chave", [
      "cobranca_pix_chave",
      "cobranca_studio_nome",
      "cobranca_msg_antecipada",
      "cobranca_msg_hoje",
      "cobranca_msg_atraso",
    ]);

  const configMap = new Map((data ?? []).map((row) => [row.chave, row.valor]));

  return {
    chave_pix: configMap.get("cobranca_pix_chave") ?? CONFIG_PADRAO.chave_pix,
    studio_nome: configMap.get("cobranca_studio_nome") ?? CONFIG_PADRAO.studio_nome,
    msg_antecipada: configMap.get("cobranca_msg_antecipada") ?? CONFIG_PADRAO.msg_antecipada,
    msg_hoje: configMap.get("cobranca_msg_hoje") ?? CONFIG_PADRAO.msg_hoje,
    msg_atraso: configMap.get("cobranca_msg_atraso") ?? CONFIG_PADRAO.msg_atraso,
  };
}

/**
 * Salva as configurações de mensagens e chave Pix na tabela public.config.
 */
export async function salvarConfiguracoesCobranca(
  novasConfigs: Partial<ConfigCobranca>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await exigeDono();

  const linhas = [
    { chave: "cobranca_pix_chave", valor: (novasConfigs.chave_pix ?? "").trim() },
    { chave: "cobranca_studio_nome", valor: (novasConfigs.studio_nome ?? "Studio Brenno Mancini").trim() },
    { chave: "cobranca_msg_antecipada", valor: (novasConfigs.msg_antecipada ?? CONFIG_PADRAO.msg_antecipada).trim() },
    { chave: "cobranca_msg_hoje", valor: (novasConfigs.msg_hoje ?? CONFIG_PADRAO.msg_hoje).trim() },
    { chave: "cobranca_msg_atraso", valor: (novasConfigs.msg_atraso ?? CONFIG_PADRAO.msg_atraso).trim() },
  ];

  for (const item of linhas) {
    const { error } = await supabase.from("config").upsert(item, { onConflict: "chave" });
    if (error) {
      return { ok: false, error: `Erro ao salvar configuração '${item.chave}': ${error.message}` };
    }
  }

  revalidatePath("/cobrancas");
  revalidatePath("/cobrancas/configuracoes");
  return { ok: true };
}

/**
 * Sincroniza e gera automaticamente cobranças recorrentes para alunos ativos que possuem
 * mensalidade e dia de vencimento combinados, caso ainda não tenham cobrança no mês corrente.
 */
export async function sincronizarMensalidadesAlunos(): Promise<void> {
  const supabase = await exigeDono();
  const hoje = dataHoje();
  const [hojeAno, hojeMes] = hoje.split("-").map(Number);
  const mesAtualRef = `${hojeAno}-${String(hojeMes).padStart(2, "0")}`;

  // Busca alunos ativos que possuem acordo financeiro configurado
  let { data: alunos } = await supabase
    .from("alunos")
    .select("id, valor_mensalidade, dia_vencimento, plano_padrao_id, periodicidade")
    .eq("status", "ativo")
    .not("valor_mensalidade", "is", null)
    .not("dia_vencimento", "is", null);

  // Fallback caso a coluna periodicidade ainda não exista no Supabase
  if (!alunos) {
    const res = await supabase
      .from("alunos")
      .select("id, valor_mensalidade, dia_vencimento, plano_padrao_id")
      .eq("status", "ativo")
      .not("valor_mensalidade", "is", null)
      .not("dia_vencimento", "is", null);
    alunos = (res.data ?? []).map((a) => ({ ...a, periodicidade: "mensal" }));
  }

  if (!alunos || alunos.length === 0) return;

  // Busca cobranças recentes desses alunos
  const alunoIds = alunos.map((a) => a.id);
  const { data: cobrancasExistentes } = await supabase
    .from("cobrancas")
    .select("aluno_id, mes_referencia, data_vencimento, status, tipo")
    .in("aluno_id", alunoIds)
    .eq("tipo", "recorrente")
    .neq("status", "cancelado");

  // Mapeia cobranças por aluno
  const cobrancasPorAluno = new Map<string, typeof cobrancasExistentes>();
  for (const c of cobrancasExistentes ?? []) {
    const list = cobrancasPorAluno.get(c.aluno_id) ?? [];
    list.push(c);
    cobrancasPorAluno.set(c.aluno_id, list);
  }

  const novasCobrancas = [];
  for (const aluno of alunos) {
    if (!aluno.valor_mensalidade || !aluno.dia_vencimento) continue;
    const listaDoAluno = cobrancasPorAluno.get(aluno.id) ?? [];
    const isTrimestral = aluno.periodicidade === "trimestral";

    if (isTrimestral) {
      // Para plano trimestral: verifica se há cobrança pendente ou se a última cobrança cobre o período
      const temPendente = listaDoAluno.some((c) => c.status === "pendente");
      if (temPendente) continue;

      // Se há cobrança paga com vencimento ainda no futuro ou nos últimos 2 meses, não precisa gerar
      const temRecente = listaDoAluno.some((c) => {
        if (!c.data_vencimento) return false;
        // Se a data de vencimento é maior que hoje, ainda está no ciclo
        if (c.data_vencimento >= hoje) return true;
        // Verifica se a última cobrança foi há menos de 3 meses
        const [anoVenc, mesVenc] = c.data_vencimento.split("-").map(Number);
        const diffMeses = (hojeAno - anoVenc) * 12 + (hojeMes - mesVenc);
        return diffMeses < 3;
      });
      if (temRecente) continue;
    } else {
      // Para plano mensal tradicional: basta checar se tem cobrança no mês atual
      const temNoMes = listaDoAluno.some((c) => c.mes_referencia === mesAtualRef);
      if (temNoMes) continue;
    }

    const diasNoMes = new Date(Date.UTC(hojeAno, hojeMes, 0)).getUTCDate();
    const diaEfetivo = Math.min(aluno.dia_vencimento, diasNoMes);
    const dataVencimento = `${hojeAno}-${String(hojeMes).padStart(2, "0")}-${String(diaEfetivo).padStart(2, "0")}`;

    novasCobrancas.push({
      aluno_id: aluno.id,
      plano_id: aluno.plano_padrao_id,
      titulo: isTrimestral ? "Trimestralidade" : "Mensalidade",
      valor: Number(aluno.valor_mensalidade),
      data_vencimento: dataVencimento,
      status: "pendente" as const,
      tipo: "recorrente" as const,
      mes_referencia: mesAtualRef,
      qtd_contatos: 0,
      observacao: isTrimestral ? "Plano Trimestral com 5% de desconto" : "",
    });
  }

  if (novasCobrancas.length > 0) {
    await supabase.from("cobrancas").insert(novasCobrancas);
  }
}

/**
 * Lista todos os dados do painel de cobranças divididos por:
 * - Atrasadas (pendentes com vencimento anterior a hoje)
 * - Vencem hoje (pendentes com vencimento hoje)
 * - Próximos 7 dias (pendentes com vencimento nos próximos 7 dias)
 * - Pagas neste mês (pagas com data de pagamento no mês corrente)
 */
export async function listarPainelCobrancas(): Promise<PainelCobrancas> {
  const supabase = await exigeDono();
  const hoje = dataHoje();
  const hojeMais7 = somarDiasData(hoje, 7);
  const mesAtualRef = hoje.slice(0, 7); // 'YYYY-MM'

  // Garante que novos alunos com mensalidade já tenham cobrança do mês
  await sincronizarMensalidadesAlunos();

  // Busca cobranças ativas e pagas recentes
  const { data: rawCobrancas, error } = await supabase
    .from("cobrancas")
    .select(
      `
      id,
      aluno_id,
      plano_id,
      titulo,
      valor,
      data_vencimento,
      status,
      data_pagamento,
      forma_pagamento,
      observacao,
      tipo,
      ultimo_contato_em,
      qtd_contatos,
      mes_referencia,
      created_at,
      updated_at,
      aluno:alunos (
        id,
        nome,
        telefone,
        valor_mensalidade,
        dia_vencimento
      )
    `
    )
    .neq("status", "cancelado")
    .order("data_vencimento", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar cobranças: ${error.message}`);
  }

  const cobrancas = (rawCobrancas ?? [])
    .filter((c) => c.aluno !== null)
    .map((c) => ({
      ...c,
      valor: Number(c.valor),
      aluno: Array.isArray(c.aluno) ? c.aluno[0] : c.aluno,
    })) as CobrancaComAluno[];

  const atrasadas: CobrancaComAluno[] = [];
  const hojeLista: CobrancaComAluno[] = [];
  const proximos: CobrancaComAluno[] = [];
  const pagasMes: CobrancaComAluno[] = [];

  let totalAtrasado = 0;
  let totalHoje = 0;
  let totalRecebidoMes = 0;

  for (const c of cobrancas) {
    if (c.status === "pendente") {
      if (c.data_vencimento < hoje) {
        atrasadas.push(c);
        totalAtrasado += c.valor;
      } else if (c.data_vencimento === hoje) {
        hojeLista.push(c);
        totalHoje += c.valor;
      } else if (c.data_vencimento > hoje && c.data_vencimento <= hojeMais7) {
        proximos.push(c);
      }
    } else if (c.status === "pago") {
      const dataComp = c.data_pagamento || c.data_vencimento;
      if (dataComp.startsWith(mesAtualRef)) {
        pagasMes.push(c);
        totalRecebidoMes += c.valor;
      }
    }
  }

  // Ordena pagas por data de pagamento decrescente
  pagasMes.sort((a, b) => {
    const dtA = a.data_pagamento || a.data_vencimento;
    const dtB = b.data_pagamento || b.data_vencimento;
    return dtB.localeCompare(dtA);
  });

  return {
    totais: {
      totalAtrasado,
      qtdAtrasado: atrasadas.length,
      totalHoje,
      qtdHoje: hojeLista.length,
      totalRecebidoMes,
      qtdRecebidoMes: pagasMes.length,
      qtdProximos7Dias: proximos.length,
    },
    atrasadas,
    hoje: hojeLista,
    proximos,
    pagasMes,
  };
}

/**
 * Marca uma cobrança como PAGA.
 * Se for recorrente, calcula automaticamente a próxima data de vencimento e gera
 * a cobrança do mês subsequente (se ainda não existir).
 */
export async function marcarComoPago(
  cobrancaId: string,
  formaPagamento: FormaPagamento = "pix",
  dataPagamento?: string
): Promise<{ ok: boolean; error?: string; novaCobrancaId?: string }> {
  const supabase = await exigeDono();
  const hoje = dataHoje();
  const dataEfetivaPagamento = dataPagamento || hoje;

  // Busca a cobrança atual
  const { data: cobranca, error: errBusca } = await supabase
    .from("cobrancas")
    .select(
      `
      id,
      aluno_id,
      plano_id,
      titulo,
      valor,
      data_vencimento,
      status,
      tipo,
      mes_referencia,
      aluno:alunos (
        id,
        dia_vencimento,
        valor_mensalidade
      )
    `
    )
    .eq("id", cobrancaId)
    .single();

  if (errBusca || !cobranca) {
    return { ok: false, error: "Cobrança não encontrada." };
  }

  if (cobranca.status === "pago") {
    return { ok: false, error: "Esta cobrança já está marcada como paga." };
  }

  // 1) Atualiza a cobrança atual para PAGO
  const { error: errUpdate } = await supabase
    .from("cobrancas")
    .update({
      status: "pago",
      data_pagamento: dataEfetivaPagamento,
      forma_pagamento: formaPagamento,
    })
    .eq("id", cobrancaId);

  if (errUpdate) {
    return { ok: false, error: `Erro ao marcar pagamento: ${errUpdate.message}` };
  }

  let novaCobrancaId: string | undefined = undefined;

  // 2) Se for recorrente, gera a próxima cobrança
  if (cobranca.tipo === "recorrente") {
    const aluno = Array.isArray(cobranca.aluno) ? cobranca.aluno[0] : cobranca.aluno;
    const diaPadrao = aluno?.dia_vencimento ?? null;
    const isTrimestral =
      (aluno as { periodicidade?: string })?.periodicidade === "trimestral" ||
      cobranca.titulo?.toLowerCase().includes("trimestral");
    const periodicidade = isTrimestral ? "trimestral" : "mensal";
    const proximoVencimento = await calcularProximoVencimento(
      cobranca.data_vencimento,
      diaPadrao,
      periodicidade
    );
    const proximoMesRef = proximoVencimento.slice(0, 7);

    // Verifica se já existe cobrança ativa para o próximo ciclo
    const { data: existeProxima } = await supabase
      .from("cobrancas")
      .select("id")
      .eq("aluno_id", cobranca.aluno_id)
      .eq("tipo", "recorrente")
      .eq("mes_referencia", proximoMesRef)
      .neq("status", "cancelado")
      .maybeSingle();

    if (!existeProxima) {
      const valorProximo = aluno?.valor_mensalidade ? Number(aluno.valor_mensalidade) : Number(cobranca.valor);

      const { data: novaCriada } = await supabase
        .from("cobrancas")
        .insert({
          aluno_id: cobranca.aluno_id,
          plano_id: cobranca.plano_id,
          titulo: isTrimestral ? "Trimestralidade" : (cobranca.titulo || "Mensalidade"),
          valor: valorProximo,
          data_vencimento: proximoVencimento,
          status: "pendente",
          tipo: "recorrente",
          mes_referencia: proximoMesRef,
          qtd_contatos: 0,
          observacao: isTrimestral ? "Plano Trimestral renovado" : "",
        })
        .select("id")
        .single();

      if (novaCriada) {
        novaCobrancaId = novaCriada.id;
      }
    }
  }

  revalidatePath("/cobrancas");
  return { ok: true, novaCobrancaId };
}

/**
 * Desfaz o pagamento de uma cobrança marcada por engano.
 * Retorna o status para 'pendente', limpa a data/forma de pagamento e
 * cancela a cobrança futura gerada automaticamente (caso ainda não tenha sido cobrada/paga).
 */
export async function desfazerPagamento(cobrancaId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await exigeDono();

  const { data: cobranca, error: errBusca } = await supabase
    .from("cobrancas")
    .select("id, aluno_id, tipo, status, mes_referencia, data_vencimento")
    .eq("id", cobrancaId)
    .single();

  if (errBusca || !cobranca) {
    return { ok: false, error: "Cobrança não encontrada." };
  }

  if (cobranca.status !== "pago") {
    return { ok: false, error: "Esta cobrança não está com status pago." };
  }

  // 1) Volta status para pendente
  const { error: errUpdate } = await supabase
    .from("cobrancas")
    .update({
      status: "pendente",
      data_pagamento: null,
      forma_pagamento: null,
    })
    .eq("id", cobrancaId);

  if (errUpdate) {
    return { ok: false, error: `Erro ao desfazer pagamento: ${errUpdate.message}` };
  }

  // 2) Se for recorrente, remove a cobrança do mês seguinte que foi gerada automaticamente
  // (somente se ainda estiver pendente e com 0 contatos)
  if (cobranca.tipo === "recorrente" && cobranca.mes_referencia) {
    await supabase
      .from("cobrancas")
      .delete()
      .eq("aluno_id", cobranca.aluno_id)
      .eq("tipo", "recorrente")
      .eq("status", "pendente")
      .eq("qtd_contatos", 0)
      .gt("mes_referencia", cobranca.mes_referencia);
  }

  revalidatePath("/cobrancas");
  return { ok: true };
}

/**
 * Registra que o dono tocou em "Cobrar no WhatsApp".
 * Incrementa o contador de contatos e atualiza a data/hora do último contato.
 */
export async function registrarContatoWhatsApp(
  cobrancaId: string
): Promise<{ ok: boolean; error?: string; qtd_contatos?: number; ultimo_contato_em?: string }> {
  const supabase = await exigeDono();

  const { data: cobranca, error: errBusca } = await supabase
    .from("cobrancas")
    .select("id, qtd_contatos")
    .eq("id", cobrancaId)
    .single();

  if (errBusca || !cobranca) {
    return { ok: false, error: "Cobrança não encontrada." };
  }

  const novaQtd = (cobranca.qtd_contatos ?? 0) + 1;
  const agora = new Date().toISOString();

  const { error: errUpdate } = await supabase
    .from("cobrancas")
    .update({
      qtd_contatos: novaQtd,
      ultimo_contato_em: agora,
    })
    .eq("id", cobrancaId);

  if (errUpdate) {
    return { ok: false, error: `Erro ao registrar contato: ${errUpdate.message}` };
  }

  revalidatePath("/cobrancas");
  return { ok: true, qtd_contatos: novaQtd, ultimo_contato_em: agora };
}

/**
 * Cria uma cobrança avulsa (ex: matrícula, avaliação, evento extra).
 */
export async function criarCobrancaAvulsa(dados: {
  alunoId: string;
  titulo: string;
  valor: number;
  dataVencimento: string;
  observacao?: string;
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  const supabase = await exigeDono();

  const titulo = (dados.titulo || "Cobrança avulsa").trim();
  const valor = Number(dados.valor);
  const dataVencimento = (dados.dataVencimento || "").trim();
  const observacao = (dados.observacao || "").trim();

  if (!dados.alunoId) return { ok: false, error: "Selecione o aluno." };
  if (!titulo || titulo.length > 120) return { ok: false, error: "O título da cobrança deve ter entre 1 e 120 caracteres." };
  if (isNaN(valor) || valor <= 0) return { ok: false, error: "Informe um valor válido maior que zero." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataVencimento)) return { ok: false, error: "Data de vencimento inválida." };

  const { data, error } = await supabase
    .from("cobrancas")
    .insert({
      aluno_id: dados.alunoId,
      titulo,
      valor,
      data_vencimento: dataVencimento,
      status: "pendente",
      tipo: "avulsa",
      observacao,
      qtd_contatos: 0,
      mes_referencia: dataVencimento.slice(0, 7),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Erro ao criar cobrança avulsa no Supabase:", error);
    return { ok: false, error: `Erro ao criar cobrança avulsa: ${error.message}` };
  }

  revalidatePath("/cobrancas");
  return { ok: true, id: data?.id };
}

/**
 * Cancela uma cobrança (ex.: cobrança criada por engano).
 */
export async function cancelarCobranca(cobrancaId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await exigeDono();

  const { error } = await supabase
    .from("cobrancas")
    .update({ status: "cancelado" })
    .eq("id", cobrancaId);

  if (error) {
    return { ok: false, error: `Erro ao cancelar cobrança: ${error.message}` };
  }

  revalidatePath("/cobrancas");
  return { ok: true };
}

/**
 * Retorna a quantidade de cobranças pendentes que estão vencidas ou vencem hoje.
 * Útil para badges de notificação na barra de navegação.
 */
export async function obterQtdCobrancasPendentesAlerta(): Promise<number> {
  const supabase = await exigeDono();
  const hoje = dataHoje();

  const { count, error } = await supabase
    .from("cobrancas")
    .select("id", { count: "exact", head: true })
    .eq("status", "pendente")
    .lte("data_vencimento", hoje);

  if (error) return 0;
  return count ?? 0;
}

/**
 * Retorna as cobranças recentes de um aluno e o status da sua mensalidade atual.
 * Útil para a tela de perfil e ficha do aluno.
 */
export async function obterResumoCobrancaAluno(alunoId: string) {
  const supabase = await exigeDono();
  const hoje = dataHoje();
  const mesAtualRef = hoje.slice(0, 7);

  const { data: cobrancas } = await supabase
    .from("cobrancas")
    .select(
      "id, titulo, valor, data_vencimento, status, data_pagamento, forma_pagamento, tipo, qtd_contatos, ultimo_contato_em, mes_referencia"
    )
    .eq("aluno_id", alunoId)
    .neq("status", "cancelado")
    .order("data_vencimento", { ascending: false })
    .limit(6);

  const lista = (cobrancas ?? []).map((c) => ({
    ...c,
    valor: Number(c.valor),
  }));

  // Cobrança pendente prioritária
  const pendente = lista.find((c) => c.status === "pendente");
  // Pagamento recente no mês atual
  const pagaMesAtual = lista.find(
    (c) =>
      c.status === "pago" &&
      ((c.data_pagamento && c.data_pagamento.startsWith(mesAtualRef)) ||
        c.data_vencimento.startsWith(mesAtualRef))
  );

  let situacao: "atrasado" | "hoje" | "pendente" | "pago" | "sem_cobranca" = "sem_cobranca";

  if (pendente) {
    if (pendente.data_vencimento < hoje) {
      situacao = "atrasado";
    } else if (pendente.data_vencimento === hoje) {
      situacao = "hoje";
    } else {
      situacao = "pendente";
    }
  } else if (pagaMesAtual) {
    situacao = "pago";
  }

  return {
    cobrancas: lista,
    pendente,
    pagaMesAtual,
    situacao,
  };
}
