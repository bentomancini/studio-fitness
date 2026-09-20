"use server";

import { exigeDono } from "@/lib/exige-login";

const statusValidos = ["ativo", "inativo"] as const;
export type StatusAluno = (typeof statusValidos)[number];

export type DadosAluno = {
  nome: string;
  telefone: string;
  observacoes: string;
  status: StatusAluno;
};

// Lê o formulário e valida. Retorna dados limpos ou mensagem de erro.
export async function lerAlunoDoForm(
  formData: FormData
): Promise<DadosAluno | { error: string }> {
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const observacoes = String(formData.get("observacoes") ?? "").trim();
  const status = String(formData.get("status") ?? "ativo");

  if (nome.length < 1 || nome.length > 120) {
    return { error: "Informe o nome do aluno (até 120 caracteres)." };
  }
  if (telefone.length > 30) {
    return { error: "O telefone é muito longo (máximo 30 caracteres)." };
  }
  if (observacoes.length > 2000) {
    return { error: "As observações são muito longas (máximo 2000 caracteres)." };
  }
  if (!(statusValidos as readonly string[]).includes(status)) {
    return { error: "Status inválido." };
  }

  return { nome, telefone, observacoes, status: status as StatusAluno };
}

export async function criarAluno(dados: DadosAluno) {
  const supabase = await exigeDono();
  const { error } = await supabase.from("alunos").insert(dados);
  if (error) {
    return { error: "Não foi possível salvar o aluno. Tente novamente." };
  }
  return { ok: true };
}

export async function atualizarAluno(id: string, dados: DadosAluno) {
  const supabase = await exigeDono();
  const { error } = await supabase.from("alunos").update(dados).eq("id", id);
  if (error) {
    return { error: "Não foi possível salvar o aluno. Tente novamente." };
  }
  return { ok: true };
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
  const { data } = await supabase
    .from("alunos")
    .select("id, nome, telefone, status")
    .order("nome");
  return data ?? [];
}

export async function listarAlunosAtivos() {
  const supabase = await exigeDono();
  const { data } = await supabase
    .from("alunos")
    .select("id, nome")
    .eq("status", "ativo")
    .order("nome");
  return data ?? [];
}

export async function buscarAluno(id: string) {
  const supabase = await exigeDono();
  const { data } = await supabase
    .from("alunos")
    .select("id, nome, telefone, observacoes, status")
    .eq("id", id)
    .single();
  return data ?? null;
}