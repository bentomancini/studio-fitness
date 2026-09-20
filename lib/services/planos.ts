"use server";

import { exigeDono } from "@/lib/exige-login";
import { dataHoje } from "@/lib/constantes";

export type Plano = { id: string; nome: string; qtd_aulas: number; validade_dias: number | null; ativo: boolean };
export type Compra = { id: string; aluno_id: string; plano_id: string; qtd_aulas: number; qtd_aulas_restantes: number; data_compra: string; validade: string | null };

export function lerDadosDoPlano(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const qtd = Number(formData.get("qtd_aulas"));
  const valRaw = String(formData.get("validade_dias") ?? "").trim();
  const vald = valRaw === "" ? null : Number(valRaw);
  if (nome.length < 1 || nome.length > 60) return { error: "Informe o nome do plano." };
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > 500) return { error: "Quantidade de aulas do plano é inválida." };
  if (vald !== null && (!Number.isInteger(vald) || vald < 1 || vald > 999)) return { error: "Validade inválida (em dias)." };
  return { nome, qtd_aulas: qtd, validade_dias: vald };
}

export async function criarPlano(dados: { nome: string; qtd_aulas: number; validade_dias: number | null }) {
  const supabase = await exigeDono();
  const { error } = await supabase.from("planos").insert({ ...dados, ativo: true });
  if (error) return { error: "Não foi possível registrar o plano." };
  return { ok: true };
}

export async function atualizarPlano(id: string, dados: { nome: string; qtd_aulas: number; validade_dias: number | null }) {
  const supabase = await exigeDono();
  const { error } = await supabase.from("planos").update(dados).eq("id", id);
  if (error) return { error: "Não foi possível salvar o plano." };
  return { ok: true };
}

export async function alternarAtivoPlano(id: string, ativo: boolean) {
  const supabase = await exigeDono();
  await supabase.from("planos").update({ ativo: !ativo }).eq("id", id);
}

export async function removerPlano(id: string) {
  const supabase = await exigeDono();
  await supabase.from("planos").delete().eq("id", id);
}

export async function listarPlanos() {
  const supabase = await exigeDono();
  const { data } = await supabase.from("planos").select("id, nome, qtd_aulas, validade_dias, ativo").order("nome");
  return data ?? [];
}

// ------------------------------------------------------------------
// Saldo (pacotes): compra de plano + consumo/devolução de aulas
// ------------------------------------------------------------------

export async function comprarPlano(alunoId: string, planoId: string) {
  const supabase = await exigeDono();
  const hoje = dataHoje();
  const { data: aluno } = await supabase.from("alunos").select("id").eq("id", alunoId).eq("status", "ativo").single();
  if (!aluno) return { error: "Aluno não encontrado ou inativo." };
  const { data: plano } = await supabase.from("planos").select("id, qtd_aulas, validade_dias").eq("id", planoId).eq("ativo", true).single();
  if (!plano) return { error: "Plano não encontrado." };

  let validade: string | null = null;
  if (plano.validade_dias) {
    const [y, m, d] = hoje.split("-").map(Number);
    const fim = new Date(Date.UTC(y, m - 1, d + (plano.validade_dias ?? 0)));
    validade = `${fim.getUTCFullYear()}-${String(fim.getUTCMonth() + 1).padStart(2, "0")}-${String(fim.getUTCDate()).padStart(2, "0")}`;
  }

  const { error } = await supabase.from("compras").insert({
    aluno_id: alunoId,
    plano_id: planoId,
    qtd_aulas: plano.qtd_aulas,
    qtd_aulas_restantes: plano.qtd_aulas,
    data_compra: hoje,
    validade,
  });
  if (error) return { error: "Não foi possível registrar a compra do pacote." };
  return { ok: true };
}

// Saldo considerando apenas pacotes com aula restante e não expirados.
export async function saldoDoAluno(alunoId: string) {
  const supabase = await exigeDono();
  const hoje = dataHoje();
  const { data } = await supabase
    .from("compras")
    .select("qtd_aulas_restantes, validade")
    .eq("aluno_id", alunoId)
    .gt("qtd_aulas_restantes", 0)
    .or(`validade.is.null,validade.gte.${hoje}`);
  return (data ?? []).reduce((soma, c) => soma + c.qtd_aulas_restantes, 0);
}

// Consome 1 aula: devolve o id do pacote usado (ou null p/ aula avulsa).
export async function consumirAula(alunoId: string) {
  const supabase = await exigeDono();
  const hoje = dataHoje();
  const { data } = await supabase
    .from("compras")
    .select("id, qtd_aulas_restantes")
    .eq("aluno_id", alunoId)
    .gt("qtd_aulas_restantes", 0)
    .or(`validade.is.null,validade.gte.${hoje}`)
    .order("validade", { ascending: true, nullsFirst: false })
    .limit(1);
  const compra = data?.[0];
  if (!compra) return null;
  await supabase.from("compras").update({ qtd_aulas_restantes: compra.qtd_aulas_restantes - 1 }).eq("id", compra.id);
  return compra.id;
}

// Devolve a aula no cancelamento.
export async function devolverAula(compraId: string | null) {
  if (!compraId) return;
  const supabase = await exigeDono();
  await supabase.rpc("devolver_aula", { compra_id: compraId });
}
