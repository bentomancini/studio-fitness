"use server";

import { exigeLogin } from "@/lib/exige-login";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type AulaFormState = { error?: string };

type DadosAula = {
  tipo_aula: string;
  dia_semana: number;
  horario: string;
  limite_vagas: number;
};

function lerEValidar(formData: FormData): DadosAula | { error: string } {
  const tipoAula = String(formData.get("tipo_aula") ?? "").trim();
  const diaSemana = Number(formData.get("dia_semana"));
  const horario = String(formData.get("horario") ?? "");
  const limiteVagas = Number(formData.get("limite_vagas"));
  const formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;

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

  return { tipo_aula: tipoAula, dia_semana: diaSemana, horario, limite_vagas: limiteVagas };
}

function mensagemDeErro(error: { code?: string } | null) {
  if (error?.code === "23505") {
    return "Já existe uma aula com esse tipo neste dia e horário.";
  }
  return "Não foi possível salvar a aula. Tente novamente.";
}

export async function createAula(
  _prev: AulaFormState,
  formData: FormData
): Promise<AulaFormState> {
  const supabase = await exigeLogin();
  const dados = lerEValidar(formData);
  if ("error" in dados) return { error: dados.error };

  const { error } = await supabase.from("aulas").insert(dados);
  if (error) return { error: mensagemDeErro(error) };

  revalidatePath("/aulas");
  redirect("/aulas");
}

export async function updateAula(
  id: string,
  _prev: AulaFormState,
  formData: FormData
): Promise<AulaFormState> {
  const supabase = await exigeLogin();
  const dados = lerEValidar(formData);
  if ("error" in dados) return { error: dados.error };

  const { error } = await supabase.from("aulas").update(dados).eq("id", id);
  if (error) return { error: mensagemDeErro(error) };

  revalidatePath("/aulas");
  redirect("/aulas");
}

export async function alternarAtiva(id: string, ativa: boolean) {
  const supabase = await exigeLogin();
  await supabase.from("aulas").update({ ativo: !ativa }).eq("id", id);
  revalidatePath("/aulas");
}

export async function removerAula(id: string) {
  const supabase = await exigeLogin();
  await supabase.from("aulas").delete().eq("id", id);
  revalidatePath("/aulas");
}