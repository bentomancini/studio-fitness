"use server";

import { exigeDono } from "@/lib/exige-login";

export type EstadoSuspensao = { error?: string };

export type AlunoAgenda = {
  id: string;
  nome: string;
  telefone: string;
  plano_padrao_id?: string | null;
  frequencia_semanal?: number | null;
  plano_nome?: string | null;
  periodicidade?: string | null;
  validade_plano?: string | null;
};

export type DadosAgenda = {
  aulas: { id: string; tipo_aula: string; dia_semana: number; horario: string; limite_vagas: number }[];
  alunos: AlunoAgenda[];
  agendamentos: { aula_id: string; aluno_id: string; data: string }[];
  suspensoes: { aula_id: string; data: string }[];
};

function textoData(valor: unknown) {
  if (typeof valor === "string") return valor.slice(0, 10);
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  return "";
}

import { dataHoje } from "@/lib/constantes";
import { listarPlanosAtivos } from "./planos";

function subtrairDias(data: string, dias: number) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const dt = new Date(ano, mes - 1, dia - dias);
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${m}-${d}`;
}

// Carrega tudo que as telas de Agenda e de Agendar precisam (otimizado com limite temporal).
export async function carregarAgenda(): Promise<DadosAgenda> {
  const supabase = await exigeDono();
  const limitePassado = subtrairDias(dataHoje(), 45);

  const [
    { data: aulas },
    alunosRes,
    { data: agendamentos },
    { data: suspensoes },
    planos,
    { data: compras },
  ] = await Promise.all([
    supabase
      .from("aulas")
      .select("id, tipo_aula, dia_semana, horario, limite_vagas")
      .eq("ativo", true),
    supabase
      .from("alunos")
      .select("id, nome, telefone, plano_padrao_id, periodicidade")
      .eq("status", "ativo")
      .order("nome")
      .then(async (res) => {
        if (res.error) {
          // Fallback caso a coluna periodicidade ainda não exista
          return await supabase
            .from("alunos")
            .select("id, nome, telefone, plano_padrao_id")
            .eq("status", "ativo")
            .order("nome");
        }
        return res;
      }),
    supabase
      .from("agendamentos")
      .select("aula_id, aluno_id, data")
      .gte("data", limitePassado),
    supabase
      .from("aulas_suspensas")
      .select("aula_id, data")
      .gte("data", limitePassado),
    listarPlanosAtivos(),
    supabase
      .from("compras")
      .select("aluno_id, validade, qtd_aulas_restantes")
      .gt("qtd_aulas_restantes", 0)
      .order("validade", { ascending: true, nullsFirst: false }),
  ]);

  const planosMap = new Map(planos.map((p) => [p.id, p]));
  const comprasMap = new Map<string, string>();
  for (const c of compras ?? []) {
    if (c.validade && !comprasMap.has(c.aluno_id)) {
      comprasMap.set(c.aluno_id, textoData(c.validade));
    }
  }

  const rawAlunos = alunosRes?.data ?? [];

  return {
    aulas: (aulas ?? []).map((a) => ({
      id: a.id,
      tipo_aula: a.tipo_aula,
      dia_semana: a.dia_semana,
      horario: a.horario,
      limite_vagas: a.limite_vagas,
    })),
    alunos: rawAlunos.map((a) => {
      const p = a.plano_padrao_id ? planosMap.get(a.plano_padrao_id) : null;
      return {
        id: a.id,
        nome: a.nome,
        telefone: a.telefone,
        plano_padrao_id: a.plano_padrao_id ?? null,
        frequencia_semanal: p?.frequencia_semanal ?? null,
        plano_nome: p?.nome ?? null,
        periodicidade: (a as { periodicidade?: string })?.periodicidade ?? "mensal",
        validade_plano: comprasMap.get(a.id) ?? null,
      };
    }),
    agendamentos: (agendamentos ?? []).map((g) => ({
      aula_id: g.aula_id,
      aluno_id: g.aluno_id,
      data: textoData(g.data),
    })),
    suspensoes: (suspensoes ?? []).map((s) => ({
      aula_id: s.aula_id,
      data: textoData(s.data),
    })),
  };
}

function apenasData(valor: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : "";
}

export async function alternarSuspensao(
  aulaId: string,
  data: string,
  suspensa: boolean
): Promise<EstadoSuspensao> {
  const supabase = await exigeDono();
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

  return {};
}