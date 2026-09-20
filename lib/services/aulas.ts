"use server";

import { exigeDono } from "@/lib/exige-login";

export type DadosAula = {
  tipo_aula: string;
  dia_semana: number;
  horario: string;
  limite_vagas: number;
};

const formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;

// Lê o formulário e valida. Retorna dados limpos ou mensagem de erro.
export async function lerAulaDoForm(
  formData: FormData
): Promise<DadosAula | { error: string }> {
  const tipoAula = String(formData.get("tipo_aula") ?? "").trim();
  const diaSemana = Number(formData.get("dia_semana"));
  const horario = String(formData.get("horario") ?? "");
  const limiteVagas = Number(formData.get("limite_vagas"));

  if (tipoAula.length < 1 || tipoAula.length > 60) {
    return { error: "Informe o tipo da aula (até 60 caracteres)." };
  }
  if (!Number.isInteger(diaSemana) || diaSemana < 0 || diaSemana > 6) {
    return { error: "Dia da semana inválido." };
  }
  if (!formatoHora.test(horario)) {
    return { error: "Horário inválido." };
  }
  if (!Number.isInteger(limiteVagas) || limiteVagas < 1 || limiteVagas > 99) {
    return { error: "O limite de vagas deve estar entre 1 e 99." };
  }

  return {
    tipo_aula: tipoAula,
    dia_semana: diaSemana,
    horario,
    limite_vagas: limiteVagas,
  };
}

function mensagemDeErro(error: { code?: string } | null) {
  if (error?.code === "23505") {
    return "Já existe uma aula com esse tipo neste dia e horário.";
  }
  return "Não foi possível salvar a aula. Tente novamente.";
}

export async function criarAula(dados: DadosAula) {
  const supabase = await exigeDono();
  const { error } = await supabase.from("aulas").insert(dados);
  if (error) return { error: mensagemDeErro(error) };
  return { ok: true };
}

export async function atualizarAula(id: string, dados: DadosAula) {
  const supabase = await exigeDono();
  const { error } = await supabase.from("aulas").update(dados).eq("id", id);
  if (error) return { error: mensagemDeErro(error) };
  return { ok: true };
}

export async function alternarAulaAtiva(id: string, ativa: boolean) {
  const supabase = await exigeDono();
  await supabase.from("aulas").update({ ativo: !ativa }).eq("id", id);
}

export async function removerAula(id: string) {
  const supabase = await exigeDono();
  await supabase.from("aulas").delete().eq("id", id);
}

export async function listarAulas() {
  const supabase = await exigeDono();
  const { data } = await supabase
    .from("aulas")
    .select("id, tipo_aula, dia_semana, horario, limite_vagas, ativo")
    .order("dia_semana")
    .order("horario");
  return data ?? [];
}

export async function listarAulasAtivas() {
  const supabase = await exigeDono();
  const { data } = await supabase
    .from("aulas")
    .select("id, tipo_aula, dia_semana, horario, limite_vagas")
    .eq("ativo", true);
  return data ?? [];
}

export async function buscarAula(id: string) {
  const supabase = await exigeDono();
  const { data } = await supabase
    .from("aulas")
    .select("id, tipo_aula, dia_semana, horario, limite_vagas")
    .eq("id", id)
    .single();
  return data ?? null;
}