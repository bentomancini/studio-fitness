"use server";

import { exigeLogin } from "@/lib/exige-login";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type AlunoFormState = { error?: string };

const statusValidos = ["ativo", "inativo"] as const;
type StatusAluno = (typeof statusValidos)[number];
type DadosAluno = {
  nome: string;
  telefone: string;
  observacoes: string;
  status: StatusAluno;
};

function lerEValidar(formData: FormData): DadosAluno | { error: string } {
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

  return {
    nome,
    telefone,
    observacoes,
    status: status as StatusAluno,
  };
}

export async function createAluno(
  _prev: AlunoFormState,
  formData: FormData
): Promise<AlunoFormState> {
  const supabase = await exigeLogin();
  const dados = lerEValidar(formData);
  if ("error" in dados) return { error: dados.error };

  const { error } = await supabase.from("alunos").insert(dados);
  if (error) {
    return { error: "Não foi possível salvar o aluno. Tente novamente." };
  }

  revalidatePath("/alunos");
  redirect("/alunos");
}

export async function updateAluno(
  id: string,
  _prev: AlunoFormState,
  formData: FormData
): Promise<AlunoFormState> {
  const supabase = await exigeLogin();
  const dados = lerEValidar(formData);
  if ("error" in dados) return { error: dados.error };

  const { error } = await supabase
    .from("alunos")
    .update(dados)
    .eq("id", id);
  if (error) {
    return { error: "Não foi possível salvar o aluno. Tente novamente." };
  }

  revalidatePath("/alunos");
  redirect("/alunos");
}

export async function alternarStatus(id: string, statusAtual: StatusAluno) {
  const supabase = await exigeLogin();
  const novoStatus = statusAtual === "ativo" ? "inativo" : "ativo";
  await supabase.from("alunos").update({ status: novoStatus }).eq("id", id);
  revalidatePath("/alunos");
}

export async function removerAluno(id: string) {
  const supabase = await exigeLogin();
  await supabase.from("alunos").delete().eq("id", id);
  revalidatePath("/alunos");
}