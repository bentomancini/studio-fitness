"use server";

import { exigeDono } from "@/lib/exige-login";
import { dataHoje, diaDaSemana } from "@/lib/constantes";
import { consumirAula, devolverAula } from "@/lib/services/planos";

function apenasData(valor: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : "";
}

async function carregarAula(
  supabase: Awaited<ReturnType<typeof exigeDono>>,
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
  supabase: Awaited<ReturnType<typeof exigeDono>>,
  alunoId: string
) {
  const { data } = await supabase
    .from("alunos")
    .select("id, status")
    .eq("id", alunoId)
    .single();
  return data;
}

export type EstadoAgendamento = { ok?: boolean; error?: string };

export async function agendarAula(
  aulaId: string,
  alunoId: string,
  data: string
): Promise<EstadoAgendamento> {
  const supabase = await exigeDono();
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

  // Executa todas as checagens em paralelo para máxima velocidade
  const [aula, aluno, suspensaRes, existenteRes, countRes] = await Promise.all([
    carregarAula(supabase, aulaId),
    carregarAluno(supabase, alunoId),
    supabase
      .from("aulas_suspensas")
      .select("id")
      .eq("aula_id", aulaId)
      .eq("data", dataLimpa)
      .maybeSingle(),
    supabase
      .from("agendamentos")
      .select("id")
      .eq("aula_id", aulaId)
      .eq("aluno_id", alunoId)
      .eq("data", dataLimpa)
      .maybeSingle(),
    supabase
      .from("agendamentos")
      .select("id", { count: "exact", head: true })
      .eq("aula_id", aulaId)
      .eq("data", dataLimpa),
  ]);

  if (!aula || !aula.ativo) {
    return { error: "Essa aula não está disponível." };
  }
  if (diaDaSemana(dataLimpa) !== aula.dia_semana) {
    return { error: "Essa aula não acontece no dia escolhido." };
  }

  if (!aluno || aluno.status !== "ativo") {
    return { error: "Aluno não encontrado ou inativo." };
  }

  if (suspensaRes.data) {
    return { error: "Essa aula está suspensa nesta data." };
  }

  if (existenteRes.data) {
    return { error: "Esse aluno já está agendado nesta aula." };
  }

  if ((countRes.count ?? 0) >= aula.limite_vagas) {
    return { error: "Aula lotada. Cancele outro aluno ou aumente as vagas." };
  }

  // Consome 1 aula do pacote mais antigo (se houver saldo).
  const compraId = await consumirAula(alunoId);

  const { error } = await supabase.from("agendamentos").insert({
    aula_id: aulaId,
    aluno_id: alunoId,
    data: dataLimpa,
    consumiu_aula: compraId !== null,
    compra_id: compraId,
  });

  if (error) {
    if (compraId) await devolverAula(compraId);
    if (error.code === "23505") {
      return { error: "Esse aluno já está agendado nesta aula." };
    }
    return { error: "Não foi possível agendar. Tente novamente." };
  }

  return { ok: true };
}

export async function cancelarAgendamento(
  aulaId: string,
  alunoId: string,
  data: string
): Promise<EstadoAgendamento> {
  const supabase = await exigeDono();
  const dataLimpa = apenasData(data);

  if (!aulaId || !alunoId || !dataLimpa) {
    return { error: "Informações do agendamento inválidas." };
  }

  // Busca o agendamento para verificar compra_id e devolver aula ao pacote
  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("id, consumiu_aula, compra_id")
    .eq("aula_id", aulaId)
    .eq("aluno_id", alunoId)
    .eq("data", dataLimpa)
    .maybeSingle();

  if (!agendamento) {
    return { error: "Agendamento não encontrado." };
  }

  const { error } = await supabase
    .from("agendamentos")
    .delete()
    .eq("id", agendamento.id);

  if (error) {
    return { error: "Não foi possível cancelar o agendamento." };
  }

  // Se consumiu aula de um pacote, devolve o crédito imediatamente
  if (agendamento.consumiu_aula && agendamento.compra_id) {
    await devolverAula(agendamento.compra_id);
  }

  return { ok: true };
}