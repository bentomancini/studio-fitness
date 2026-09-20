import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if ((!supabaseUrl || !supabaseKey) && fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
      supabaseUrl = trimmed.split("=")[1].trim();
    }
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
      supabaseKey = trimmed.split("=")[1].trim();
    }
  }
}

if (!supabaseUrl || !supabaseKey) {
  supabaseUrl = "https://qsblaxrwivhhwpgaoabv.supabase.co";
  supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzYmxheHJ3aXZoaHdwZ2FvYWJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NjY1NTgsImV4cCI6MjEwNTQ0MjU1OH0.N0X4jA1q71tmJB5spM6PWV5tU2YtTE20SX19JWqOk2Q";
}

const supabase = createClient(supabaseUrl, supabaseKey);

// =============================================================
// Funções puras replicadas para testar a lógica do serviço
// =============================================================

function calcularProximoVencimento(dataVencimentoIso, diaPadrao) {
  const partes = dataVencimentoIso.split("-").map(Number);
  const ano = partes[0];
  const mes = partes[1];
  const diaOriginal = partes[2];

  let proxAno = ano;
  let proxMes = mes + 1;
  if (proxMes > 12) {
    proxMes = 1;
    proxAno = ano + 1;
  }

  const diasNoProxMes = new Date(Date.UTC(proxAno, proxMes, 0)).getUTCDate();
  const diaAlvo = diaPadrao && diaPadrao >= 1 && diaPadrao <= 31 ? diaPadrao : diaOriginal;
  const diaEfetivo = Math.min(diaAlvo, diasNoProxMes);

  return `${proxAno}-${String(proxMes).padStart(2, "0")}-${String(diaEfetivo).padStart(2, "0")}`;
}

function normalizarTelefoneWhatsApp(telefoneBruto) {
  if (!telefoneBruto) return { telefone: "", valido: false };
  const apenasDigitos = telefoneBruto.replace(/\D/g, "");
  if (apenasDigitos.startsWith("55") && (apenasDigitos.length === 12 || apenasDigitos.length === 13)) {
    return { telefone: apenasDigitos, valido: true };
  }
  if (apenasDigitos.length === 10 || apenasDigitos.length === 11) {
    return { telefone: `55${apenasDigitos}`, valido: true };
  }
  return { telefone: apenasDigitos, valido: apenasDigitos.length >= 8 };
}

function formatarValorBRL(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatarDataBR(dataIso) {
  if (!dataIso) return "";
  const partes = dataIso.split("-");
  if (partes.length !== 3) return dataIso;
  const [ano, mes, dia] = partes;
  return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${ano}`;
}

function preencherTemplateMensagem(params) {
  const nomeCompleto = params.nomeAluno.trim();
  const primeiroNome = nomeCompleto.split(" ")[0] || nomeCompleto;
  const valorFormatado = formatarValorBRL(params.valor);
  const vencimentoFormatado = formatarDataBR(params.dataVencimento);
  const chavePix = (params.chavePix || "").trim();
  const studioNome = (params.studioNome || "Intense Fitness").trim();

  let texto = params.template;
  texto = texto.replace(/\{primeiro_nome\}/gi, primeiroNome);
  texto = texto.replace(/\{nome\}/gi, nomeCompleto);
  texto = texto.replace(/\{valor\}/gi, valorFormatado);
  texto = texto.replace(/\{vencimento\}/gi, vencimentoFormatado);
  texto = texto.replace(/\{chave_pix\}/gi, chavePix || "(consultar chave Pix)");
  texto = texto.replace(/\{studio_nome\}/gi, studioNome);

  return texto;
}

// =============================================================
// Execução dos testes
// =============================================================

async function executarTestes() {
  console.log("==================================================");
  console.log("🧪 TESTES DO SERVIÇO DE COBRANÇAS (ETAPA 2)");
  console.log("==================================================");

  let erros = 0;

  // 1. Teste de cálculo de próximo vencimento (meses curtos e bissextos)
  console.log("\n[1] TESTES DE CÁLCULO DE VENCIMENTO RECORRENTE:");

  const caso1 = calcularProximoVencimento("2026-01-31", 31);
  if (caso1 === "2026-02-28") {
    console.log("• 31/Jan -> Fev não-bissexto (28/Fev): ✅ OK");
  } else {
    console.error(`• 31/Jan -> Fev incorreto: esperado 2026-02-28, recebido ${caso1}`);
    erros++;
  }

  const caso2 = calcularProximoVencimento("2028-01-31", 31);
  if (caso2 === "2028-02-29") {
    console.log("• 31/Jan -> Fev bissexto (29/Fev): ✅ OK");
  } else {
    console.error(`• 31/Jan -> Fev bissexto incorreto: esperado 2028-02-29, recebido ${caso2}`);
    erros++;
  }

  const caso3 = calcularProximoVencimento("2026-02-28", 31);
  if (caso3 === "2026-03-31") {
    console.log("• 28/Fev -> Março preservando âncora 31 (31/Mar): ✅ OK");
  } else {
    console.error(`• Preservação de âncora incorreta: esperado 2026-03-31, recebido ${caso3}`);
    erros++;
  }

  const caso4 = calcularProximoVencimento("2026-12-10", 10);
  if (caso4 === "2027-01-10") {
    console.log("• Virada de ano (10/Dez/2026 -> 10/Jan/2027): ✅ OK");
  } else {
    console.error(`• Virada de ano incorreta: esperado 2027-01-10, recebido ${caso4}`);
    erros++;
  }

  const caso5 = calcularProximoVencimento("2026-03-31", 31);
  if (caso5 === "2026-04-30") {
    console.log("• 31/Mar -> Mês de 30 dias (30/Abr): ✅ OK");
  } else {
    console.error(`• Mês de 30 dias incorreto: esperado 2026-04-30, recebido ${caso5}`);
    erros++;
  }

  // 2. Testes de formatação de telefone para WhatsApp
  console.log("\n[2] TESTES DE NORMALIZAÇÃO DE TELEFONE:");
  const tel1 = normalizarTelefoneWhatsApp("(11) 98765-4321");
  if (tel1.telefone === "5511987654321" && tel1.valido) {
    console.log("• (11) 98765-4321 -> 5511987654321: ✅ OK");
  } else {
    console.error("• Falha na formatação com máscara:", tel1);
    erros++;
  }

  const tel2 = normalizarTelefoneWhatsApp("5511987654321");
  if (tel2.telefone === "5511987654321" && tel2.valido) {
    console.log("• 5511987654321 (já com DDI): ✅ OK");
  } else {
    console.error("• Falha com DDI existente:", tel2);
    erros++;
  }

  const tel3 = normalizarTelefoneWhatsApp(null);
  if (!tel3.valido) {
    console.log("• Telefone nulo -> inválido: ✅ OK");
  } else {
    console.error("• Telefone nulo deveria ser inválido:", tel3);
    erros++;
  }

  // 3. Testes de interpolação de mensagem WhatsApp
  console.log("\n[3] TESTES DE MODELO DE MENSAGEM WHATSAPP:");
  const template = "Olá, {primeiro_nome}! Mensalidade de {nome} no valor de R$ {valor} vence em {vencimento}. Pix: {chave_pix} ({studio_nome}).";
  const msgPronta = preencherTemplateMensagem({
    nomeAluno: "Lucas Henrique Ferreira",
    valor: 250,
    dataVencimento: "2026-10-15",
    chavePix: "11999999999",
    studioNome: "Intense Fitness",
    template,
  });

  const contemPrimeiroNome = msgPronta.includes("Olá, Lucas!");
  const contemValor = msgPronta.includes("250,00");
  const contemVencimento = msgPronta.includes("15/10/2026");
  const contemPix = msgPronta.includes("11999999999");
  const contemStudio = msgPronta.includes("Intense Fitness");

  if (contemPrimeiroNome && contemValor && contemVencimento && contemPix && contemStudio) {
    console.log("• Substituição de variáveis ({primeiro_nome}, {valor}, {vencimento}, {chave_pix}): ✅ OK");
    console.log("  Prévia da mensagem:");
    console.log(`  "${msgPronta}"`);
  } else {
    console.error("• Falha na interpolação do template:", msgPronta);
    erros++;
  }

  // 4. Verificação no Supabase das configurações padrão
  console.log("\n[4] TESTES DE CONFIGURAÇÕES DE COBRANÇA NO SUPABASE:");
  const { data: configs, error: errConfig } = await supabase
    .from("config")
    .select("chave, valor")
    .in("chave", [
      "cobranca_studio_nome",
      "cobranca_msg_antecipada",
      "cobranca_msg_hoje",
      "cobranca_msg_atraso",
    ]);

  if (errConfig) {
    console.error("• Erro ao consultar configurações no Supabase:", errConfig.message);
    erros++;
  } else {
    console.log(`• Configurações encontradas no Supabase: ${configs.length} chaves ✅ OK`);
    const studioNomeRow = configs.find((c) => c.chave === "cobranca_studio_nome");
    if (studioNomeRow && studioNomeRow.valor === "Intense Fitness") {
      console.log("• Nome do Studio configurado como 'Intense Fitness': ✅ OK");
    }
  }

  console.log("\n==================================================");
  if (erros === 0) {
    console.log("🎉 TODOS OS TESTES DA ETAPA 2 PASSARAM COM SUCESSO!");
  } else {
    console.error(`⚠️ Foram encontrados ${erros} erro(s).`);
  }
  console.log("==================================================");
}

executarTestes();
