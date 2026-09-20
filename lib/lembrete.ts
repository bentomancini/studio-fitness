// Monta o link do WhatsApp com o lembrete pronto do aluno.
// Usa o formato wa.me (sem pagar API): abre o WhatsApp com a mensagem montada.
export function montarLembreteWhatsApp(opcoes: {
  nome: string;
  telefone: string;
  tipoAula: string;
  horario: string;
  data: string;
}): string | null {
  const digitos = opcoes.telefone.replace(/\D/g, "");
  if (digitos.length < 10) return null;

  const [ano, mes, dia] = opcoes.data.split("-");
  const dataTexto = `${dia}/${mes}/${ano}`;
  const mensagem =
    `Olá ${opcoes.nome}! Lembrete da sua aula de ${opcoes.tipoAula} ` +
    `em ${dataTexto} às ${opcoes.horario}. Qualquer imprevisto, me avise!`;

  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`;
}