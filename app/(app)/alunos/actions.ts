"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  lerAlunoDoForm,
  criarAluno,
  atualizarAluno,
  alternarStatusAluno,
  removerAluno,
  type StatusAluno,
} from "@/lib/services/alunos";

export type AlunoFormState = { error?: string };

export async function createAluno(
  _prev: AlunoFormState,
  formData: FormData
): Promise<AlunoFormState> {
  const dados = await lerAlunoDoForm(formData);
  if ("error" in dados) return { error: dados.error };

  const resultado = await criarAluno(dados);
  if ("error" in resultado) return { error: resultado.error };

  revalidatePath("/alunos");
  redirect("/alunos");
}

export async function updateAluno(
  id: string,
  _prev: AlunoFormState,
  formData: FormData
): Promise<AlunoFormState> {
  const dados = await lerAlunoDoForm(formData);
  if ("error" in dados) return { error: dados.error };

  const resultado = await atualizarAluno(id, dados);
  if ("error" in resultado) return { error: resultado.error };

  revalidatePath("/alunos");
  redirect("/alunos");
}

export async function alternarStatus(id: string, statusAtual: StatusAluno) {
  await alternarStatusAluno(id, statusAtual);
  revalidatePath("/alunos");
}

export async function removerAlunoAction(id: string) {
  await removerAluno(id);
  revalidatePath("/alunos");
}