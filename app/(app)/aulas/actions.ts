"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  lerAulaDoForm,
  criarAula,
  atualizarAula,
  alternarAulaAtiva,
  removerAula,
} from "@/lib/services/aulas";

export type AulaFormState = { error?: string };

export async function createAula(
  _prev: AulaFormState,
  formData: FormData
): Promise<AulaFormState> {
  const dados = await lerAulaDoForm(formData);
  if ("error" in dados) return { error: dados.error };

  const resultado = await criarAula(dados);
  if ("error" in resultado) return { error: resultado.error };

  revalidatePath("/aulas");
  redirect("/aulas");
}

export async function updateAula(
  id: string,
  _prev: AulaFormState,
  formData: FormData
): Promise<AulaFormState> {
  const dados = await lerAulaDoForm(formData);
  if ("error" in dados) return { error: dados.error };

  const resultado = await atualizarAula(id, dados);
  if ("error" in resultado) return { error: resultado.error };

  revalidatePath("/aulas");
  redirect("/aulas");
}

export async function alternarAtiva(id: string, ativa: boolean) {
  await alternarAulaAtiva(id, ativa);
  revalidatePath("/aulas");
}

export async function removerAulaAction(id: string) {
  await removerAula(id);
  revalidatePath("/aulas");
}