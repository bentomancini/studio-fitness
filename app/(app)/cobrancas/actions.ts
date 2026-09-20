"use server";

import {
  marcarComoPago,
  desfazerPagamento,
  registrarContatoWhatsApp,
  criarCobrancaAvulsa,
  cancelarCobranca,
  salvarConfiguracoesCobranca,
  FormaPagamento,
} from "@/lib/services/cobrancas";

export async function acaoMarcarComoPago(dados: {
  cobrancaId: string;
  formaPagamento: FormaPagamento;
  dataPagamento?: string;
}) {
  return await marcarComoPago(dados.cobrancaId, dados.formaPagamento, dados.dataPagamento);
}

export async function acaoDesfazerPagamento(cobrancaId: string) {
  return await desfazerPagamento(cobrancaId);
}

export async function acaoRegistrarContatoWhatsApp(cobrancaId: string) {
  return await registrarContatoWhatsApp(cobrancaId);
}

export async function acaoCriarCobrancaAvulsa(formData: FormData) {
  const alunoId = String(formData.get("aluno_id") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const valorStr = String(formData.get("valor") ?? "").replace(",", ".");
  const dataVencimento = String(formData.get("data_vencimento") ?? "");
  const observacao = String(formData.get("observacao") ?? "").trim();

  const valor = parseFloat(valorStr);

  return await criarCobrancaAvulsa({
    alunoId,
    titulo: titulo || "Cobrança avulsa",
    valor,
    dataVencimento,
    observacao,
  });
}

export async function acaoCancelarCobranca(cobrancaId: string) {
  return await cancelarCobranca(cobrancaId);
}

export async function acaoSalvarConfiguracoesCobranca(dados: {
  chave_pix: string;
  studio_nome: string;
  msg_antecipada: string;
  msg_hoje: string;
  msg_atraso: string;
}) {
  return await salvarConfiguracoesCobranca(dados);
}
