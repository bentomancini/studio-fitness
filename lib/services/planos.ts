"use server";

import { exigeDono } from "@/lib/exige-login";
import { dataHoje, resgatar } from "@/lib/constantes";

export type Plano = { id: string; nome: string; qtd_aulas: number; validade_dias: number | null; ativo: boolean };
export type Compra = { id: string; aluno_id: string; plano_id: string; qtd_aulas: number; qtd_aulas_restantes: number; data_compra: string; validade: string | null };

export function lerPlano(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const qtd = Number(formData.get("qtd_aulas"));
  const valRaw = String(formData.get("validade_dias") ?? "").trim();
  const vald = valRaw ? Number(valRaw) : null; // dias 1-999 ou vazio = sem prazo
  if (nome.length < 1 || nome.length > 60) return { error: "Informe o nome do plano." };
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > 500) return { error: "Quantidade de aulas inválida." };
  if (vald !== null && (!Number.isInteger(vald) || vald < 1 || vald > 999)) return { error: "Validade inválida (em dias)." };
  return { nome, qtd_aulas: qtd, validade_dias: vald };
}

export async function criarPlano(dados) {
  const supabase = await exigeDono();
  const { error } = await supabase.from("planos").insert({ ...dados, ativo: true });
  if (error) return { error: "Não foi possível criar o plano." };
  return { ok: true };
}

export async function atualizarPlano(id, dados) {
  const supabase = await exigeDono();
  const { error } = await supabase.from("planos").update(dados).eq("id", id);
  if (error) return { error: "Não foi possível salvar o plano." };
  return { ok: true };
}

export async function alternarPlanoAtivo(id, ativo) {
  const supabase = await exigeDono();
  await supabase.from("planos").update({ ativo: !ativo }).eq("id", id);
}

export async function removerPlano(id) {
  const supabase = await exigeDono();
  await supabase.from("planos").delete().eq("id", id);
}

export async function listarPlanos() {
  const supabase = await exigeDono();
  const { data } = await supabase.from("planos").select("id, nome, qtd_aulas, validade_dias, ativo").order("nome");
  return data ?? [];
}

export async function buscarPlano(id) {
  const supabase = await exigeDono();
  const { data } = await supabase.from("planos").select("id, nome, qtd_aulas, validade_dias").eq("id", id).single();
  return data ?? null;
}

// Compra de um plano para o aluno: cria a compra e joga o saldo.
export async function comprarPlano(alunoId, planoId) {
  const supabase = await exigeDono();
  const { data: aluno } = await supabase.from("alunos").select("id, status").eq("id", alunoId).single();
  if (!aluno || aluno.status !== "ativo") return { error: "Aluno não encontrado ou inativo." };
  const { data: plano } = await supabase.from("planos").select("id, qtd_aulas, validade_dias").eq("id", planoId).eq("ativo", true).single();
  if (!plano) return { error: "Plano não encontrado ou inativo." };

  const hoje = dataHoje();
  let validade = null;
  if (plano.validade_dias) {
    const [y, m, d] = hoje.split("-").map(Number);
    const fim = new Date(Date.UTC(y, m - 1, d + plano.validade_dias));
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
  if (error) return { error: "Não foi possível registrar a compra." };
  return { ok: true };
}

// Saldo: soma o que ainda restar de compras não expiradas.
export async function saldoDoAluno(alunoId) {
  const supabase = await exigeDono();
  const hoje = dataHoje();
  const { data } = await supabase.from("compras").select("qtd_aulas_restantes, validade").eq("aluno_id", alunoId);
  const ativas = (data ?? [])
    .filter((c) => c.qtd_aulas_restantes > 0 && (!c.validade || c.validade >= hoje))
    .reduce((s, c) => s + c.qtd_aulas_restantes, 0);
  return ativas;
}

// Consome 1 aula da compra ativa com o prazo mais curto.
export async function consumirAula(alunoId) {
  const supabase = await exigeDono();
  const hoje = dataHoje();
  const { data } = await supabase
    .from("compras")
    .select("id, qtd_aulas_restantes, validade")
    .eq("aluno_id", alunoId)
    .gt("qtd_aulas_restantes", 0)
    .or(`validade.is.null,validade.gte.${hoje}`)
    .order("validade", { ascending: true, nullsFirst: false })
    .limit(1);
  const compra = data?.[0];
  if (compra) {
    await supabase.from("compras").update({ qtd_aulas_restantes: compra.qtd_aulas_restantes - 1 }).eq("id", compra.id);
    return compra.id;
  }
  return null;
}

// Devolve a aula (compra ativa) na hora de cancelar.
export async function devolverAula(compraId) {
  const supabase = await exigeDono();
  if (!compraId) return;
  await supabase.rpc("somaraula", { compraid: compraId }).catch(() => {});
  const { data } = await supabase.from("compras").select("id, qtd_aulas_restantes").eq("id", compraId).single();
  if (data) {
    await supabase.from("compras").update({ qtd_aulas_restantes: data.qtd_aulas_restantes + 1 }).eq("id", compraId);
  }
}
