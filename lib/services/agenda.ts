"use server";

import { exigeDono } from "@/lib/exige-login";

export type EstadoSuspensao = { error?: string };

export type DadosAgenda = {
  aulas: { id: string; tipo_aula: string; dia_semana: number; horario: string; limite_vagas: number }[];
  alunos: { id: string; nome: string }[];
  agendamentos: { aula_id: string; aluno_id: string; data: string }[];
  suspensoes: { aula_id: string; data: string }[];
};

function textoData(valor: unknown) {
  if (typeof valor === "string") return valor.slice(0, 10);
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  return "";
}

// Carrega tudo que as telas de Agenda e de Agendar precisam.
export async function carregarAgenda(): Promise<DadosAgenda> {
  const supabase = await exigeDono();

  const [{ data: aulas }, { data: alunos }, { data: agendamentos }, { data: suspensoes }] =
    await Promise.all([
      supabase
        .from("aulas")
        .select("id, tipo_aula, dia_semana, horario, limite_vagas")
        .eq("ativo", true),
      supabase.from("alunos").select("id, nome").eq("status", "ativo").order("nome"),
      supabase.from("agendamentos").select("aula_id, aluno_id, data"),
      supabase.from("aulas_suspensas").select("aula_id, data"),
    ]);

  return {
    aulas: (aulas ?? []).map((a) => ({
      id: a.id,
      tipo_aula: a.tipo_aula,
      dia_semana: a.dia_semana,
      horario: a.horario,
      limite_vagas: a.limite_vagas,
    })),
    alunos: (alunos ?? []).map((a) => ({ id: a.id, nome: a.nome })),
    agendamentos: (agendamentos ?? []).map((g) => ({
      aula_id: g.aula_id,
      aluno_id: g.aluno_id,
      data: textoData(g.data),
    })),
    suspensoes: (suspensoes ?? []).map((s) => ({
      aula_id: s.aula_id,
      data: textoData(s.data),
    })),
  };
}

function apenasData(valor: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : "";
}

export async function alternarSuspensao(
  aulaId: string,
  data: string,
  suspensa: boolean
): Promise<EstadoSuspensao> {
  const supabase = await exigeDono();
  const dataLimpa = apenasData(data);

  if (!aulaId || !dataLimpa) {
    return { error: "Informações inválidas." };
  }

  if (suspensa) {
    const { error } = await supabase
      .from("aulas_suspensas")
      .delete()
      .eq("aula_id", aulaId)
      .eq("data", dataLimpa);
    if (error) return { error: "Não foi possível reativar. Tente novamente." };
  } else {
    const { error } = await supabase.from("aulas_suspensas").insert({
      aula_id: aulaId,
      data: dataLimpa,
    });
    if (error) {
      if (error.code === "23505") {
        return { error: "Essa aula já está suspensa neste dia." };
      }
      return { error: "Não foi possível suspender. Tente novamente." };
    }
  }

  return {};
}