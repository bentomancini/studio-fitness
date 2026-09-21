"use server";

import { exigeDono } from "@/lib/exige-login";
import { dataHoje } from "@/lib/constantes";

const statusValidos = ["ativo", "inativo"] as const;
export type StatusAluno = (typeof statusValidos)[number];

export type PeriodicidadePlano = "mensal" | "trimestral";

export type DadosAluno = {
  nome: string;
  telefone: string;
  observacoes: string;
  status: StatusAluno;
  data_nascimento: string | null;
  profissao: string;
  tem_empresa: boolean;
  empresa_nome: string;
  empresa_ramo: string;
  tem_dores_cronicas: boolean;
  dores_cronicas_descricao: string;
  lesoes: string;
  estilo_treino: string;
  descricao_aluno: string;
  valor_mensalidade?: number | null;
  dia_vencimento?: number | null;
  plano_padrao_id?: string | null;
  periodicidade?: PeriodicidadePlano;
};

export type AlunoCompleto = DadosAluno & {
  id: string;
  created_at: string;
  updated_at: string;
};

function ehUUIDValido(str: string | null | undefined): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function ehErroColunaInexistente(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    (typeof error.message === "string" && error.message.includes("does not exist")) ||
    (typeof error.message === "string" && error.message.includes("schema cache"))
  );
}

/**
 * Calcula a idade em anos a partir de uma data YYYY-MM-DD.
 * Não armazena valor fixo no banco para manter o dado sempre atual.
 */
export async function calcularIdade(dataNascStr: string | null | undefined): Promise<number | null> {
  if (!dataNascStr) return null;
  const partes = dataNascStr.split("-").map(Number);
  if (partes.length !== 3) return null;
  const [ano, mes, dia] = partes;
  if (!ano || !mes || !dia) return null;

  const hojeStr = dataHoje();
  const [hojeAno, hojeMes, hojeDia] = hojeStr.split("-").map(Number);

  let idade = hojeAno - ano;
  if (hojeMes < mes || (hojeMes === mes && hojeDia < dia)) {
    idade--;
  }
  return idade >= 0 ? idade : null;
}

/**
 * Lê o formulário, valida todas as regras no servidor e limpa dados condicionais.
 */
export async function lerAlunoDoForm(
  formData: FormData
): Promise<DadosAluno | { error: string }> {
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const status = String(formData.get("status") ?? "ativo");
  const dataNascimentoRaw = String(formData.get("data_nascimento") ?? "").trim();
  const profissao = String(formData.get("profissao") ?? "").trim();
  
  // Booleanos: checa se está marcado como "true", "on" ou "1"
  const temEmpresaRaw = formData.get("tem_empresa");
  const tem_empresa = temEmpresaRaw === "true" || temEmpresaRaw === "on" || temEmpresaRaw === "1";
  const empresa_nome = tem_empresa ? String(formData.get("empresa_nome") ?? "").trim() : "";
  const empresa_ramo = tem_empresa ? String(formData.get("empresa_ramo") ?? "").trim() : "";

  const temDoresRaw = formData.get("tem_dores_cronicas");
  const tem_dores_cronicas = temDoresRaw === "true" || temDoresRaw === "on" || temDoresRaw === "1";
  const dores_cronicas_descricao = tem_dores_cronicas
    ? String(formData.get("dores_cronicas_descricao") ?? "").trim()
    : "";

  const lesoes = String(formData.get("lesoes") ?? "").trim();
  const estilo_treino = String(formData.get("estilo_treino") ?? "").trim();
  const descricao_aluno = String(formData.get("descricao_aluno") ?? "").trim();
  const observacoes = String(formData.get("observacoes") ?? "").trim();

  // Validações obrigatórias
  if (nome.length < 1 || nome.length > 120) {
    return { error: "Informe o nome do aluno (até 120 caracteres)." };
  }
  if (telefone.length > 30) {
    return { error: "O telefone é muito longo (máximo 30 caracteres)." };
  }
  if (!(statusValidos as readonly string[]).includes(status)) {
    return { error: "Status inválido." };
  }

  // Validação de Data de Nascimento (opcional, mas se informada deve ser válida e não futura)
  let data_nascimento: string | null = null;
  if (dataNascimentoRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNascimentoRaw)) {
      return { error: "Data de nascimento inválida. Use o formato padrão." };
    }
    const [ano, mes, dia] = dataNascimentoRaw.split("-").map(Number);
    if (ano < 1900 || mes < 1 || mes > 12 || dia < 1 || dia > 31) {
      return { error: "Data de nascimento inválida." };
    }
    const hoje = dataHoje();
    if (dataNascimentoRaw > hoje) {
      return { error: "A data de nascimento não pode ser futura." };
    }
    data_nascimento = dataNascimentoRaw;
  }

  // Limites de tamanho de texto (proteção contra payloads abusivos)
  if (profissao.length > 120) {
    return { error: "A profissão deve ter no máximo 120 caracteres." };
  }
  if (empresa_nome.length > 120) {
    return { error: "O nome da empresa deve ter no máximo 120 caracteres." };
  }
  if (empresa_ramo.length > 120) {
    return { error: "O ramo da empresa deve ter no máximo 120 caracteres." };
  }
  if (dores_cronicas_descricao.length > 1000) {
    return { error: "A descrição das dores deve ter no máximo 1000 caracteres." };
  }
  if (lesoes.length > 1000) {
    return { error: "O campo de lesões deve ter no máximo 1000 caracteres." };
  }
  if (estilo_treino.length > 1000) {
    return { error: "O estilo de treino deve ter no máximo 1000 caracteres." };
  }
  if (descricao_aluno.length > 3000) {
    return { error: "A descrição do aluno deve ter no máximo 3000 caracteres." };
  }
  if (observacoes.length > 2000) {
    return { error: "As observações devem ter no máximo 2000 caracteres." };
  }

  // Acordo Financeiro (opcional)
  const valorMensalidadeRaw = String(formData.get("valor_mensalidade") ?? "").trim().replace(",", ".");
  let valor_mensalidade: number | null = null;
  if (valorMensalidadeRaw) {
    const v = parseFloat(valorMensalidadeRaw);
    if (isNaN(v) || v <= 0) {
      return { error: "O valor da mensalidade deve ser maior que zero." };
    }
    valor_mensalidade = v;
  }

  const diaVencimentoRaw = String(formData.get("dia_vencimento") ?? "").trim();
  let dia_vencimento: number | null = null;
  if (diaVencimentoRaw) {
    const d = parseInt(diaVencimentoRaw, 10);
    if (isNaN(d) || d < 1 || d > 31) {
      return { error: "O dia de vencimento deve estar entre 1 e 31." };
    }
    dia_vencimento = d;
  }

  const periodicidadeRaw = String(formData.get("periodicidade") ?? "mensal").toLowerCase().trim();
  const periodicidade: PeriodicidadePlano = periodicidadeRaw === "trimestral" ? "trimestral" : "mensal";

  const planoPadraoRaw = String(formData.get("plano_padrao_id") ?? "").trim();
  const plano_padrao_id = ehUUIDValido(planoPadraoRaw) ? planoPadraoRaw : null;

  return {
    nome,
    telefone,
    observacoes,
    status: status as StatusAluno,
    data_nascimento,
    profissao,
    tem_empresa,
    empresa_nome,
    empresa_ramo,
    tem_dores_cronicas,
    dores_cronicas_descricao,
    lesoes,
    estilo_treino,
    descricao_aluno,
    valor_mensalidade,
    dia_vencimento,
    plano_padrao_id,
    periodicidade,
  };
}

export async function criarAluno(dados: DadosAluno) {
  const supabase = await exigeDono();

  // Limpa plano_padrao_id se não for uuid válido para evitar erro 22P02 no Postgres
  const payload: Record<string, unknown> = {
    ...dados,
    plano_padrao_id: ehUUIDValido(dados.plano_padrao_id) ? dados.plano_padrao_id : null,
  };

  // Tenta salvar com todos os campos da Ficha Completa + periodicidade
  let { data, error } = await supabase
    .from("alunos")
    .insert(payload)
    .select("id")
    .single();

  // Se a coluna periodicidade ainda não foi criada no Supabase, tenta novamente sem ela
  if (error && (ehErroColunaInexistente(error) || error.message.includes("periodicidade"))) {
    const semPeriodicidade = { ...payload };
    delete semPeriodicidade.periodicidade;
    const retryRes = await supabase
      .from("alunos")
      .insert(semPeriodicidade)
      .select("id")
      .single();
    data = retryRes.data;
    error = retryRes.error;
  }

  if (!error && data) {
    if (dados.valor_mensalidade && dados.dia_vencimento && dados.status === "ativo") {
      try {
        const { sincronizarMensalidadesAlunos } = await import("@/lib/services/cobrancas");
        await sincronizarMensalidadesAlunos();
      } catch {
        // Tolerância caso ocorra erro assíncrono na sincronização
      }
    }
    return { ok: true, id: data.id };
  }

  // Se o banco ainda não tem as novas colunas (migration 004 não rodada), faz fallback seguro
  if (ehErroColunaInexistente(error)) {
    console.warn("Colunas da migration 004 não encontradas no Supabase. Salvando aluno com dados básicos...");
    const dadosBasicos = {
      nome: dados.nome,
      telefone: dados.telefone,
      observacoes: dados.observacoes,
      status: dados.status,
    };
    const fallbackRes = await supabase
      .from("alunos")
      .insert(dadosBasicos)
      .select("id")
      .single();

    if (!fallbackRes.error && fallbackRes.data) {
      return { ok: true, id: fallbackRes.data.id };
    }
    console.error("Erro no fallback de criarAluno:", fallbackRes.error);
    return { error: `Erro ao salvar aluno: ${fallbackRes.error?.message || "Tente novamente."}` };
  }

  console.error("Erro criarAluno:", error);
  return { error: `Não foi possível salvar o aluno: ${error?.message || "Tente novamente."}` };
}

export async function atualizarAluno(id: string, dados: DadosAluno) {
  const supabase = await exigeDono();

  // Limpa plano_padrao_id se não for uuid válido para evitar erro 22P02 no Postgres
  const payload: Record<string, unknown> = {
    ...dados,
    plano_padrao_id: ehUUIDValido(dados.plano_padrao_id) ? dados.plano_padrao_id : null,
  };

  let { error } = await supabase.from("alunos").update(payload).eq("id", id);

  // Se a coluna periodicidade ainda não foi criada no Supabase, tenta novamente sem ela
  if (error && (ehErroColunaInexistente(error) || error.message.includes("periodicidade"))) {
    const semPeriodicidade = { ...payload };
    delete semPeriodicidade.periodicidade;
    const retryRes = await supabase.from("alunos").update(semPeriodicidade).eq("id", id);
    error = retryRes.error;
  }

  if (!error) {
    if (dados.valor_mensalidade && dados.dia_vencimento && dados.status === "ativo") {
      try {
        const { sincronizarMensalidadesAlunos } = await import("@/lib/services/cobrancas");
        await sincronizarMensalidadesAlunos();
      } catch {
        // Tolerância caso ocorra erro assíncrono na sincronização
      }
    }
    return { ok: true, id };
  }

  // Fallback seguro caso as colunas da migration 004 ainda não tenham sido criadas
  if (ehErroColunaInexistente(error)) {
    console.warn("Colunas da migration 004 não encontradas no Supabase. Atualizando aluno com dados básicos...");
    const dadosBasicos = {
      nome: dados.nome,
      telefone: dados.telefone,
      observacoes: dados.observacoes,
      status: dados.status,
    };
    const fallbackRes = await supabase.from("alunos").update(dadosBasicos).eq("id", id);
    if (!fallbackRes.error) {
      return { ok: true, id };
    }
    return { error: `Erro ao salvar aluno: ${fallbackRes.error?.message || "Tente novamente."}` };
  }

  console.error("Erro atualizarAluno:", error);
  return { error: `Não foi possível salvar o aluno: ${error?.message || "Tente novamente."}` };
}

export async function alternarStatusAluno(id: string, statusAtual: StatusAluno) {
  const supabase = await exigeDono();
  const proximo = statusAtual === "ativo" ? "inativo" : "ativo";
  await supabase.from("alunos").update({ status: proximo }).eq("id", id);
}

export async function removerAluno(id: string) {
  const supabase = await exigeDono();
  await supabase.from("alunos").delete().eq("id", id);
}

export async function listarAlunos() {
  const supabase = await exigeDono();
  const { data, error } = await supabase
    .from("alunos")
    .select("id, nome, telefone, status, data_nascimento, profissao, tem_dores_cronicas")
    .order("nome");

  if (!error && data) {
    return data;
  }

  // Fallback para caso as novas colunas ainda não estejam criadas no Supabase
  if (ehErroColunaInexistente(error)) {
    const fallback = await supabase
      .from("alunos")
      .select("id, nome, telefone, status")
      .order("nome");
    return fallback.data ?? [];
  }

  return data ?? [];
}

export type AlunoResumoAtivo = {
  id: string;
  nome: string;
  telefone?: string;
  valor_mensalidade?: number | null;
  dia_vencimento?: number | null;
  plano_padrao_id?: string | null;
  periodicidade?: PeriodicidadePlano;
};

export async function listarAlunosAtivos(): Promise<AlunoResumoAtivo[]> {
  const supabase = await exigeDono();
  const { data, error } = await supabase
    .from("alunos")
    .select("id, nome, telefone, valor_mensalidade, dia_vencimento, plano_padrao_id, periodicidade")
    .eq("status", "ativo")
    .order("nome");

  const alunosData = error
    ? (
        await supabase
          .from("alunos")
          .select("id, nome, telefone, valor_mensalidade, dia_vencimento, plano_padrao_id")
          .eq("status", "ativo")
          .order("nome")
      ).data
    : data;

  return (alunosData ?? []).map((a) => {
    const raw = a as {
      id: string;
      nome: string;
      telefone?: string | null;
      valor_mensalidade?: number | string | null;
      dia_vencimento?: number | string | null;
      plano_padrao_id?: string | null;
      periodicidade?: string | null;
    };
    return {
      id: raw.id,
      nome: raw.nome,
      telefone: raw.telefone ?? "",
      valor_mensalidade: raw.valor_mensalidade ? Number(raw.valor_mensalidade) : null,
      dia_vencimento: raw.dia_vencimento ? Number(raw.dia_vencimento) : null,
      plano_padrao_id: raw.plano_padrao_id ?? null,
      periodicidade: (raw.periodicidade === "trimestral" ? "trimestral" : "mensal") as PeriodicidadePlano,
    };
  });
}

export async function buscarAluno(id: string): Promise<AlunoCompleto | null> {
  const supabase = await exigeDono();
  const { data, error } = await supabase
    .from("alunos")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  // Garante que todos os campos novos existam no objeto com valores padrão seguros
  return {
    id: data.id,
    nome: data.nome ?? "",
    telefone: data.telefone ?? "",
    observacoes: data.observacoes ?? "",
    status: data.status ?? "ativo",
    data_nascimento: data.data_nascimento ?? null,
    profissao: data.profissao ?? "",
    tem_empresa: Boolean(data.tem_empresa),
    empresa_nome: data.empresa_nome ?? "",
    empresa_ramo: data.empresa_ramo ?? "",
    tem_dores_cronicas: Boolean(data.tem_dores_cronicas),
    dores_cronicas_descricao: data.dores_cronicas_descricao ?? "",
    lesoes: data.lesoes ?? "",
    estilo_treino: data.estilo_treino ?? "",
    descricao_aluno: data.descricao_aluno ?? "",
    valor_mensalidade: data.valor_mensalidade ? Number(data.valor_mensalidade) : null,
    dia_vencimento: data.dia_vencimento ? Number(data.dia_vencimento) : null,
    plano_padrao_id: data.plano_padrao_id ?? null,
    periodicidade: (data.periodicidade === "trimestral" ? "trimestral" : "mensal") as PeriodicidadePlano,
    created_at: data.created_at ?? "",
    updated_at: data.updated_at ?? "",
  };
}