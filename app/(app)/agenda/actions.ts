"use server";

import { revalidatePath } from "next/cache";
import {
  alternarSuspensao as alternarSuspensaoService,
  type EstadoSuspensao as EstadoSuspensaoService,
} from "@/lib/services/agenda";

export type EstadoSuspensao = EstadoSuspensaoService;

export async function alternarSuspensao(
  aulaId: string,
  data: string,
  suspensa: boolean,
  _prev: EstadoSuspensao,
  _formData: FormData
): Promise<EstadoSuspensao> {
  void _prev;
  void _formData;
  const resultado = await alternarSuspensaoService(aulaId, data, suspensa);
  revalidatePath("/");
  return resultado;
}