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

export async function acaoCriarCobrancaAvulsa(dados: {
  alunoId: string;
  titulo: string;
  valor: number;
  dataVencimento: string;
  observacao?: string;
}) {
  return await criarCobrancaAvulsa(dados);
}

export async function acaoCancelarCobranca(cobrancaId: string) {
  return await cancelarCobranca(cobrancaId);
}

export async function acaoExcluirCobranca(cobrancaId: string) {
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
