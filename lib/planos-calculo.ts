export type Plano = {
  id: string;
  nome: string;
  categoria?: string;
  frequencia_semanal?: number;
  preco_mensal?: number;
  descricao?: string;
  qtd_aulas: number;
  validade_dias: number | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
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

/**
 * Calcula o valor trimestral com 5% de desconto sobre o total de 3 meses.
 * Realiza os cálculos em centavos inteiros para garantir precisão matemática ao centavo.
 * Valores de conferência:
 * 1x (319,90) -> 911,72
 * 2x (349,90) -> 997,22
 * 3x (469,90) -> 1339,22
 * 4x (589,90) -> 1681,22
 * 5x (699,90) -> 1994,72
 */
export function calcularPlanoTrimestral(precoMensal: number) {
  const totalSemDescontoCents = Math.round(precoMensal * 100) * 3;
  const trimestralCents = Math.round(totalSemDescontoCents * 0.95);
  const economiaCents = totalSemDescontoCents - trimestralCents;
  const equivMesCents = Math.round(trimestralCents / 3);

  return {
    totalTrimestral: trimestralCents / 100,
    economia: economiaCents / 100,
    equivalentePorMes: equivMesCents / 100,
    totalSemDesconto: totalSemDescontoCents / 100,
  };
}

export const PLANOS_PADRAO: Plano[] = [
  {
    id: "plano-1x-semana",
    nome: "1x por semana",
    categoria: "Atendimento e treinamento personalizado",
    frequencia_semanal: 1,
    preco_mensal: 319.90,
    qtd_aulas: 4,
    validade_dias: 30,
    descricao: "1 atendimento personalizado por semana",
    ativo: true,
  },
  {
    id: "plano-2x-semana",
    nome: "2x por semana",
    categoria: "Atendimento e treinamento personalizado",
    frequencia_semanal: 2,
    preco_mensal: 349.90,
    qtd_aulas: 8,
    validade_dias: 30,
    descricao: "2 atendimentos personalizados por semana",
    ativo: true,
  },
  {
    id: "plano-3x-semana",
    nome: "3x por semana",
    categoria: "Atendimento e treinamento personalizado",
    frequencia_semanal: 3,
    preco_mensal: 469.90,
    qtd_aulas: 12,
    validade_dias: 30,
    descricao: "3 atendimentos personalizados por semana",
    ativo: true,
  },
  {
    id: "plano-4x-semana",
    nome: "4x por semana",
    categoria: "Atendimento e treinamento personalizado",
    frequencia_semanal: 4,
    preco_mensal: 589.90,
    qtd_aulas: 16,
    validade_dias: 30,
    descricao: "4 atendimentos personalizados por semana",
    ativo: true,
  },
  {
    id: "plano-5x-semana",
    nome: "5x por semana",
    categoria: "Atendimento e treinamento personalizado",
    frequencia_semanal: 5,
    preco_mensal: 699.90,
    qtd_aulas: 20,
    validade_dias: 30,
    descricao: "5 atendimentos personalizados por semana",
    ativo: true,
  },
];
