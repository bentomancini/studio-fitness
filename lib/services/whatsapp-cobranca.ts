export type ParametrosMensagemWhatsApp = {
  nomeAluno: string;
  valor: number;
  dataVencimento: string; // YYYY-MM-DD
  chavePix: string;
  studioNome?: string;
  template: string;
};

/**
 * Formata um número em formato BRL amigável (ex: 250,00).
 */
export function formatarValorBRL(valor: number): string {
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata data YYYY-MM-DD para DD/MM/AAAA.
 */
export function formatarDataBR(dataIso: string): string {
  if (!dataIso) return "";
  const partes = dataIso.split("-");
  if (partes.length !== 3) return dataIso;
  const [ano, mes, dia] = partes;
  return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${ano}`;
}

/**
 * Normaliza o telefone para o formato internacional exigido pelo WhatsApp (DDI + DDD + número).
 * Exemplo: "(11) 98765-4321" -> "5511987654321"
 */
export function normalizarTelefoneWhatsApp(telefoneBruto: string | null | undefined): {
  telefone: string;
  valido: boolean;
} {
  if (!telefoneBruto) return { telefone: "", valido: false };

  const apenasDigitos = telefoneBruto.replace(/\D/g, "");

  // Se já tem DDI 55 e tamanho padrão (12 ou 13 dígitos: 55 + DDD (2) + 8 ou 9 dígitos)
  if (apenasDigitos.startsWith("55") && (apenasDigitos.length === 12 || apenasDigitos.length === 13)) {
    return { telefone: apenasDigitos, valido: true };
  }

  // Se tem DDD e número (10 ou 11 dígitos), prefixa com 55 (Brasil)
  if (apenasDigitos.length === 10 || apenasDigitos.length === 11) {
    return { telefone: `55${apenasDigitos}`, valido: true };
  }

  // Outros tamanhos incomuns são considerados inválidos para link direto
  return { telefone: apenasDigitos, valido: apenasDigitos.length >= 8 };
}

/**
 * Substitui as variáveis {primeiro_nome}, {nome}, {valor}, {vencimento}, {chave_pix}, {studio_nome}
 * no modelo de texto configurado pelo usuário.
 */
export function preencherTemplateMensagem(params: ParametrosMensagemWhatsApp): string {
  const nomeCompleto = params.nomeAluno.trim();
  const primeiroNome = nomeCompleto.split(" ")[0] || nomeCompleto;
  const valorFormatado = formatarValorBRL(params.valor);
  const vencimentoFormatado = formatarDataBR(params.dataVencimento);
  const chavePix = (params.chavePix || "").trim();
  const studioNome = (params.studioNome || "Studio Brenno Mancini").trim();

  let texto = params.template;

  texto = texto.replace(/\{primeiro_nome\}/gi, primeiroNome);
  texto = texto.replace(/\{nome\}/gi, nomeCompleto);
  texto = texto.replace(/\{valor\}/gi, valorFormatado);
  texto = texto.replace(/\{vencimento\}/gi, vencimentoFormatado);
  texto = texto.replace(/\{chave_pix\}/gi, chavePix || "(consultar chave Pix)");
  texto = texto.replace(/\{studio_nome\}/gi, studioNome);

  return texto;
}

/**
 * Gera o link nativo wa.me com a mensagem pré-carregada e codificada para URL.
 */
export function gerarLinkWhatsApp(
  telefoneBruto: string | null | undefined,
  params: ParametrosMensagemWhatsApp
): {
  url: string | null;
  texto: string;
  telefoneValido: boolean;
  telefoneFormatado: string;
} {
  const { telefone, valido } = normalizarTelefoneWhatsApp(telefoneBruto);
  const texto = preencherTemplateMensagem(params);

  if (!valido || !telefone) {
    return {
      url: null,
      texto,
      telefoneValido: false,
      telefoneFormatado: telefone,
    };
  }

  const url = `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`;
  return {
    url,
    texto,
    telefoneValido: true,
    telefoneFormatado: telefone,
  };
}
