"use server";

import { exigeLogin } from "@/lib/exige-login";
import { revalidatePath } from "next/cache";

export type EstadoSuspensao = { error?: string };

function apenasData(valor: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : "";
}

export async function alternarSuspensao(
  aulaId: string,
  data: string,
  suspensa: boolean,
  _prev: EstadoSuspensao,
  _formData: FormData
): Promise<EstadoSuspensao> {
  void _prev;
  void _formData;
  const supabase = await exigeLogin();
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

  revalidatePath("/");
  return {};
}