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

export function dataHoje() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

export function diaDaSemana(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia).getDay();
}

export function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
}