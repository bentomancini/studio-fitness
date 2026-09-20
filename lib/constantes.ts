export const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export function formatoHorario(horario: string) {
  return horario.slice(0, 5);
}

const FUSO = "America/Sao_Paulo";

export function dataHoje() {
  // Sempre usa o fuso do estúdio (Brasília), não o do servidor.
  const hoje = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return hoje;
}

export function diaDaSemana(data: string) {
  // Data-calendário: converte sem fuso para não puxar o "dia" errado.
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

export function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
}