"use server";

import { exigeDono } from "@/lib/exige-login";
import { dataHoje } from "@/lib/constantes";

export type Plano = {
  id: string;
  nome: string;
  qtd_aulas: number;
  validade_dias: number | null;
  ativo: boolean;
};

export type Compra = {
  id: string;
  aluno_id: string;
  plano_id: string;
  qtd_aulas: number;
  qtd_aulas_restantes: number;
  data_compra: string;
  validade: string | null;
};

function lerDadosDoPlano(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const qtd = Number(formData.get("qtd_aulas"));
  const valRaw = String(formData.get("validade_dias") ?? "").trim();
  const validadeDias = valRaw ? Number(valRaw) : null     ;
  if (nome.length < 1 || nome.length > 60) return { error: "Informe o nome do plano." };
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > 500) return { error: "Quantidade de aulas do plano é inválida." };
  if (validadeDias !== null && (!Number.isInteger(validadeDias) || validadeDias < 1 || validadeDias > 999)) {
    return { error: "Validade inválida (em dias)." };
  }
  return { nome, qtd_aulas: qtd, validade_dias: validadeDias };
}

function lerCompraDoForm(formData: FormData) {
  const alunoId = String(formData.get("aluno_id") ?? "");
  const planoId = String(formData.get("plano_id") ?? "");
  if (!alunoId || !planoId) return { error: "Escolha o aluno e o plano do pacote." };
  return { aluno_id: alunoId, plano_id: planoId };
}

export async function criarPlano(dados: { nome: string; qtd_aulas: number; validade_dias: number | null }) {
  const supabase = await exigeDono();
  const { error } = await supabase.from("planos").insert(dados);
  if (error) return { error: "Não foi possível criar o plano." };
  return { ok: true };
}

export async function atualizarPlano(id: string, dados: { nome: string; qtd_aulas: number; validade_dias: number | null }) {
  const supabase = await exigeDono();
  const { error } = await supabase.from("planos").update(dados).eq("id", id);
  if (error) return { error: "Não foi possível salvar o plano." };
  return { ok: true };
}

export async function alternarPlanoAtivo(id: string, ativo: boolean) {
  const supabase = await exigeDono();
  await supabase.from("planos").update({ ativo: !ativo }).eq("id", id);
}

export async function removerPlano(id: string) {
  const supabase = await exigeDono();
  await supabase.from("planos").delete().eq("id", id);
}

export async function listarPlanos() {
  const supabase = await exigeDono();
  const { data } = await supabase.from("planos").select("*").order("nome");
  return (data ?? []) as Plano[];
}

export async function listarPlanosAtivos() {
  const supabase = await exigeDono();
  const { data } = await supabase.from("planos").select("*").eq("ativo", true).order("nome");
  return (data ?? []) as Plano[];
}

export async function buscarPlano(id: string) {
  const supabase = await exigeDono();
  const { data } = await supabase.from("planos").select("*").eq("id", id).single();
  return (data ?? null) as Plano | null;
}

// Compra um pacote (plano) para o aluno e cria o saldo inicial.
export async function comprarPlano(alunoId: string) {
  const supabase = await exigeDono();
  const { data } = await supabase.from("planos").select("id, qtd_aulas, validade_dias").eq("ativo", true).order("nome").limit(1);
  const plano = data?.[0];
  if (!plano) return { error: "Nenhum plano disponível para compra no momento." };
  const { error } = await supabase.from("compras").insert({
    aluno_id: alunoId,
    plano_id: plano.id,
    qtd_aulas: plano.qtd_aulas,
    qtd_aulas_restantes: plano.qtd_aulas,
    data_compra: dataHoje ? dataHoje() : new Date().toISOString().slice(0, 10),
    validade: null,
  });
  if (error) return { error: "Não foi possível registrar a compra do pacote." };
  return { ok: true };
}

// Saldo disponível do aluno (soma as aulas restantes dos pacotes ativos).
export async function saldoDoAluno(alunoId: string) {
  const supabase = await exigeDono();
  const { data } = await supabase
    .from("compras")
    .select("qtd_aulas_restantes, validade")
    .eq("aluno_id", alunoId);
  const hoje = dataHoje ? dataHoje() : new Date().toISOString().slice(0, 10);
  const total = (data ?? [])
    .filter((c) => c.qtd_aulas_restantes > 0 && (!c.validade || c.validade >= hoje))
    .reduce((soma, c) => soma + c.qtd_aulas_restantes, 0);
  return total;
}

// Consome 1 aula do pacote mais antigo válido do aluno; devolve o id.
export async function consumirAula(alunoId: string) {
  const supabase = await exigeDono();
  const hoje = dataHoje ? dataHoje() : new Date().toISOString().slice(0, 10);
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
  await supabase
    .from("compras")
    .update({ qtd_aulas_restantes: compra.qtd_aulas_restantes - 1 })
    .eq("id", compra.id);
  return compra.id;
}

// Devolve a aula ao cancelar o agendamento (compra é o id do pacote).
export async function devolverAula(compraId: string | null) {
  if (!compraId) return;
  const supabase = await exigeDono();
  const { data } = await supabase.from("compras").select("id, qtd_aulas_restantes").eq("id", compraId).single();
  if (data) {
    await supabase
      .from("compras")
      .update({ qtd_aulas_restantes: data.qtd_aulas_restantes + 1 })
      .eq("id", compraId);
  }
}
