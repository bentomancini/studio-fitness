"use server";

import { exigeDono } from "@/lib/exige-login";
import { dataHoje } from "@/lib/constantes";

import { revalidatePath } from "next/cache";
import {
  type Plano,
  type Compra,
  PLANOS_PADRAO,
} from "@/lib/planos-calculo";

export type { Plano, Compra };

export async function criarPlano(dados: {
  nome: string;
  categoria?: string;
  frequencia_semanal?: number;
  preco_mensal?: number;
  descricao?: string;
  qtd_aulas?: number;
  validade_dias?: number | null;
}) {
  const supabase = await exigeDono();

  const frequencia = dados.frequencia_semanal ?? 1;
  const { error } = await supabase.from("planos").insert({
    nome: dados.nome,
    categoria: dados.categoria ?? "Atendimento e treinamento personalizado",
    frequencia_semanal: frequencia,
    preco_mensal: dados.preco_mensal ?? null,
    descricao: dados.descricao ?? "",
    qtd_aulas: dados.qtd_aulas ?? (frequencia * 4),
    validade_dias: dados.validade_dias ?? 30,
    ativo: true,
  });

  if (error) return { error: `Não foi possível criar o plano: ${error.message}` };
  revalidatePath("/cobrancas/configuracoes");
  return { ok: true };
}

export async function atualizarPlano(
  id: string,
  dados: {
    nome?: string;
    preco_mensal?: number;
    ativo?: boolean;
    descricao?: string;
  }
) {
  const supabase = await exigeDono();

  if (dados.preco_mensal !== undefined && (isNaN(dados.preco_mensal) || dados.preco_mensal <= 0)) {
    return { error: "O preço mensal deve ser maior que zero." };
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (dados.nome !== undefined) updates.nome = dados.nome.trim();
  if (dados.preco_mensal !== undefined) updates.preco_mensal = dados.preco_mensal;
  if (dados.ativo !== undefined) updates.ativo = dados.ativo;
  if (dados.descricao !== undefined) updates.descricao = dados.descricao.trim();

  const { error } = await supabase.from("planos").update(updates).eq("id", id);
  if (error) return { error: `Não foi possível salvar o plano: ${error.message}` };

  revalidatePath("/cobrancas/configuracoes");
  revalidatePath("/alunos");
  return { ok: true };
}

export async function alternarPlanoAtivo(id: string, ativoAtual: boolean) {
  const supabase = await exigeDono();
  await supabase.from("planos").update({ ativo: !ativoAtual }).eq("id", id);
  revalidatePath("/cobrancas/configuracoes");
}

export async function removerPlano(id: string) {
  const supabase = await exigeDono();
  const { error } = await supabase.from("planos").delete().eq("id", id);
  if (error) return { error: "Não foi possível remover o plano." };
  revalidatePath("/cobrancas/configuracoes");
  return { ok: true };
}

export async function listarPlanos(): Promise<Plano[]> {
  try {
    const supabase = await exigeDono();
    const { data, error } = await supabase
      .from("planos")
      .select("*")
      .order("frequencia_semanal", { ascending: true })
      .order("preco_mensal", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((p) => ({
        ...p,
        preco_mensal: p.preco_mensal ? Number(p.preco_mensal) : undefined,
        frequencia_semanal: p.frequencia_semanal ?? 1,
      }));
    }
  } catch (err) {
    console.warn("Aviso ao buscar planos do banco:", err);
  }

  return PLANOS_PADRAO;
}

export async function listarPlanosAtivos(): Promise<Plano[]> {
  try {
    const supabase = await exigeDono();
    const { data, error } = await supabase
      .from("planos")
      .select("*")
      .eq("ativo", true)
      .order("frequencia_semanal", { ascending: true })
      .order("preco_mensal", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((p) => ({
        ...p,
        preco_mensal: p.preco_mensal ? Number(p.preco_mensal) : undefined,
        frequencia_semanal: p.frequencia_semanal ?? 1,
      }));
    }
  } catch (err) {
    console.warn("Aviso ao buscar planos ativos do banco:", err);
  }

  return PLANOS_PADRAO.filter((p) => p.ativo);
}

export async function buscarPlano(id: string): Promise<Plano | null> {
  try {
    const supabase = await exigeDono();
    const { data, error } = await supabase.from("planos").select("*").eq("id", id).maybeSingle();
    if (!error && data) {
      return {
        ...data,
        preco_mensal: data.preco_mensal ? Number(data.preco_mensal) : undefined,
        frequencia_semanal: data.frequencia_semanal ?? 1,
      };
    }
  } catch (err) {
    console.warn("Aviso ao buscar plano do banco:", err);
  }

  return PLANOS_PADRAO.find((p) => p.id === id) ?? null;
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
