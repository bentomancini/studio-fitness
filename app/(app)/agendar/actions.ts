"use server";

import { revalidatePath } from "next/cache";
import {
  agendarAula as agendarAulaService,
  cancelarAgendamento as cancelarAgendamentoService,
  type EstadoAgendamento,
} from "@/lib/services/agendamentos";

export type EstadoAcao = EstadoAgendamento;

export async function agendarAula(
  aulaId: string,
  alunoId: string,
  data: string,
  _prev: EstadoAcao,
  _formData: FormData
): Promise<EstadoAcao> {
  void _prev;
  void _formData;
  const resultado = await agendarAulaService(aulaId, alunoId, data);
  if (resultado.ok) revalidatePath("/agendar");
  return resultado;
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
  const resultado = await cancelarAgendamentoService(aulaId, alunoId, data);
  if (resultado.ok) revalidatePath("/agendar");
  return resultado;
}