"use server";

import { exigeLogin } from "@/lib/exige-login";
import { dataHoje, diaDaSemana } from "@/lib/constantes";
import { revalidatePath } from "next/cache";

export type EstadoAcao = { ok?: boolean; error?: string };

function apenasData(valor: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : "";
}

async function carregarAula(
  supabase: Awaited<ReturnType<typeof exigeLogin>>,
  aulaId: string
) {
  const { data } = await supabase
    .from("aulas")
    .select("id, dia_semana, limite_vagas, ativo")
    .eq("id", aulaId)
    .single();
  return data;
}

async function carregarAluno(
  supabase: Awaited<ReturnType<typeof exigeLogin>>,
  alunoId: string
) {
  const { data } = await supabase
    .from("alunos")
    .select("id, status")
    .eq("id", alunoId)
    .single();
  return data;
}

function mesmaData(aulaId: string, alunoId: string, data: string) {
  return { aula_id: aulaId, aluno_id: alunoId, data };
}

export async function agendarAula(
  aulaId: string,
  alunoId: string,
  data: string,
  _prev: EstadoAcao,
  _formData: FormData
): Promise<EstadoAcao> {
  void _prev;
  void _formData;
  const supabase = await exigeLogin();
  const dataLimpa = apenasData(data);
  const hoje = dataHoje();

  if (!aulaId || !alunoId) {
    return { error: "Escolha um aluno e um horário para agendar." };
  }
  if (!dataLimpa) {
    return { error: "Data inválida." };
  }
  if (dataLimpa < hoje) {
    return { error: "Não é possível agendar uma aula no passado." };
  }

  const aula = await carregarAula(supabase, aulaId);
  if (!aula || !aula.ativo) {
    return { error: "Essa aula não está disponível." };
  }
  if (diaDaSemana(dataLimpa) !== aula.dia_semana) {
    return { error: "Essa aula não acontece no dia escolhido." };
  }

  const aluno = await carregarAluno(supabase, alunoId);
  if (!aluno || aluno.status !== "ativo") {
    return { error: "Aluno não encontrado ou inativo." };
  }

  const { data: suspensa } = await supabase
    .from("aulas_suspensas")
    .select("id")
    .eq("aula_id", aulaId)
    .eq("data", dataLimpa)
    .maybeSingle();
  if (suspensa) {
    return { error: "Essa aula está suspensa nesta data." };
  }

  const { data: existente } = await supabase
    .from("agendamentos")
    .select("id")
    .eq("aula_id", aulaId)
    .eq("aluno_id", alunoId)
    .eq("data", dataLimpa)
    .maybeSingle();
  if (existente) {
    return { error: "Esse aluno já está agendado nesta aula." };
  }

  const { count } = await supabase
    .from("agendamentos")
    .select("id", { count: "exact", head: true })
    .eq("aula_id", aulaId)
    .eq("data", dataLimpa);
  if ((count ?? 0) >= aula.limite_vagas) {
    return { error: "Aula lotada. Cancele outro aluno ou aumente as vagas." };
  }

  const { error } = await supabase.from("agendamentos").insert(
    mesmaData(aulaId, alunoId, dataLimpa)
  );
  if (error) {
    if (error.code === "23505") {
      return { error: "Esse aluno já está agendado nesta aula." };
    }
    return { error: "Não foi possível agendar. Tente novamente." };
  }

  revalidatePath("/agendar");
  return { ok: true };
}

export async function cancelarAgendamento(
  aulaId: string,
  alunoId: string,
  data: string,
  _prev: EstadoAcao,
  _formData: FormData
): Promise<EstadoAcao> {
  void _prev;
  void _formData;
  const supabase = await exigeLogin();
  const dataLimpa = apenasData(data);

  if (!aulaId || !alunoId || !dataLimpa) {
    return { error: "Informações do agendamento inválidas." };
  }

  const { data: removidos, error } = await supabase
    .from("agendamentos")
    .delete()
    .eq("aula_id", aulaId)
    .eq("aluno_id", alunoId)
    .eq("data", dataLimpa)
    .select("id");
  if (error || !removidos || removidos.length === 0) {
    return { error: "Agendamento não encontrado." };
  }

  revalidatePath("/agendar");
  return { ok: true };
}