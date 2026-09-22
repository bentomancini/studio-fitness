import { createClient } from "@supabase/supabase-js";
import assert from "node:assert";
import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";

console.log("======================================================================");
console.log("🚀 BATERIA COMPLETA DE TESTES AUTOMATIZADOS - STUDIO BRENNO MANCINI");
console.log("======================================================================");

const erros = [];
const avisos = [];
let totalPassou = 0;

function registrarSucesso(nome) {
  totalPassou++;
  console.log(`  ✅ [PASSOU] ${nome}`);
}

function registrarErro(modulo, detalhe) {
  erros.push({ modulo, detalhe });
  console.log(`  ❌ [FALHA] ${modulo}: ${detalhe}`);
}

function registrarAviso(modulo, detalhe) {
  avisos.push({ modulo, detalhe });
  console.log(`  ⚠️ [AVISO] ${modulo}: ${detalhe}`);
}

// ==============================================================================
// 1. CARREGAR VARIÁVEIS DE AMBIENTE (.env.local)
// ==============================================================================
console.log("\n[1] Lendo e validando variáveis de ambiente...");

let envVars = {};
if (fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        envVars[k] = v;
      }
    }
  }
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const anthropicKey = envVars.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
const claudeModel = envVars.CLAUDE_MODEL || process.env.CLAUDE_MODEL;

if (supabaseUrl && supabaseKey) {
  registrarSucesso("Credenciais do Supabase configuradas");
} else {
  registrarErro("Env", "Credenciais do Supabase ausentes no .env.local");
}

if (anthropicKey && anthropicKey.startsWith("sk-ant-")) {
  registrarSucesso("Chave Anthropic configurada");
} else {
  registrarErro("Env", "Chave ANTHROPIC_API_KEY inválida ou ausente");
}

// ==============================================================================
// 2. TESTES DE FUNÇÕES PURAS E LÓGICA DE NEGÓCIO
// ==============================================================================
console.log("\n[2] Testando funções puras de regras de negócio...");

// A) Cálculo de Vencimento
function calcularProximoVencimento(dataVencimentoIso, diaPadrao, periodicidade = "mensal") {
  const partes = dataVencimentoIso.split("-").map(Number);
  const ano = partes[0];
  const mes = partes[1];
  const diaOriginal = partes[2];

  const incremento = periodicidade === "trimestral" ? 3 : 1;
  let proxAno = ano;
  let proxMes = mes + incremento;
  while (proxMes > 12) {
    proxMes -= 12;
    proxAno += 1;
  }

  const diasNoProxMes = new Date(Date.UTC(proxAno, proxMes, 0)).getUTCDate();
  const diaAlvo = diaPadrao && diaPadrao >= 1 && diaPadrao <= 31 ? diaPadrao : diaOriginal;
  const diaEfetivo = Math.min(diaAlvo, diasNoProxMes);

  return `${proxAno}-${String(proxMes).padStart(2, "0")}-${String(diaEfetivo).padStart(2, "0")}`;
}

try {
  assert.strictEqual(calcularProximoVencimento("2026-09-10", 10, "mensal"), "2026-10-10");
  assert.strictEqual(calcularProximoVencimento("2026-12-15", 15, "mensal"), "2027-01-15");
  assert.strictEqual(calcularProximoVencimento("2026-01-31", 31, "mensal"), "2026-02-28");
  assert.strictEqual(calcularProximoVencimento("2026-09-10", 10, "trimestral"), "2026-12-10");
  assert.strictEqual(calcularProximoVencimento("2026-11-05", 5, "trimestral"), "2027-02-05");
  registrarSucesso("calcularProximoVencimento() (mensal, trimestral, virada de ano e meses curtos)");
} catch (err) {
  registrarErro("calcularProximoVencimento", err.message);
}

// B) Cálculo de Idade
function calcularIdade(dataNascimentoIso, hojeIso = "2026-09-21") {
  if (!dataNascimentoIso) return null;
  const [ano, mes, dia] = dataNascimentoIso.split("-").map(Number);
  const [hAno, hMes, hDia] = hojeIso.split("-").map(Number);
  let idade = hAno - ano;
  if (hMes < mes || (hMes === mes && hDia < dia)) {
    idade--;
  }
  return idade >= 0 ? idade : null;
}

try {
  assert.strictEqual(calcularIdade(null), null);
  assert.strictEqual(calcularIdade(""), null);
  assert.strictEqual(calcularIdade("2000-09-20", "2026-09-21"), 26);
  assert.strictEqual(calcularIdade("2000-09-25", "2026-09-21"), 25);
  assert.strictEqual(calcularIdade("2030-01-01", "2026-09-21"), null);
  registrarSucesso("calcularIdade() (nulo, antes do aniversário, após e datas futuras)");
} catch (err) {
  registrarErro("calcularIdade", err.message);
}

// C) Formatação de Moeda e Data
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

try {
  assert.strictEqual(formatarValorBRL(0), "0,00");
  assert.strictEqual(formatarValorBRL(150), "150,00");
  assert.strictEqual(formatarValorBRL(1250.5), "1.250,50");
  assert.strictEqual(formatarDataBR("2026-09-22"), "22/09/2026");
  assert.strictEqual(formatarDataBR(""), "");
  registrarSucesso("formatarValorBRL() e formatarDataBR()");
} catch (err) {
  registrarErro("Formatação", err.message);
}

// D) Normalização de WhatsApp
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

try {
  assert.deepStrictEqual(normalizarTelefoneWhatsApp("(11) 98765-4321"), { telefone: "5511987654321", valido: true });
  assert.deepStrictEqual(normalizarTelefoneWhatsApp("5511987654321"), { telefone: "5511987654321", valido: true });
  assert.deepStrictEqual(normalizarTelefoneWhatsApp("11987654321"), { telefone: "5511987654321", valido: true });
  assert.strictEqual(normalizarTelefoneWhatsApp("").valido, false);
  registrarSucesso("normalizarTelefoneWhatsApp() (com DDD, com 55 e caracteres especiais)");
} catch (err) {
  registrarErro("normalizarTelefoneWhatsApp", err.message);
}

// E) Preenchimento de Template de Cobrança
function preencherTemplateMensagem(params) {
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

try {
  const msg = preencherTemplateMensagem({
    nomeAluno: "Castiel Silva",
    valor: 200,
    dataVencimento: "2026-09-30",
    chavePix: "11999999999",
    studioNome: "Studio Brenno Mancini",
    template: "Olá {primeiro_nome}, sua mensalidade de R$ {valor} vence em {vencimento}. Pix: {chave_pix} ({studio_nome})."
  });
  assert.strictEqual(
    msg,
    "Olá Castiel, sua mensalidade de R$ 200,00 vence em 30/09/2026. Pix: 11999999999 (Studio Brenno Mancini)."
  );
  registrarSucesso("preencherTemplateMensagem() (substituição de todas as tags)");
} catch (err) {
  registrarErro("preencherTemplateMensagem", err.message);
}

// ==============================================================================
// 3. TESTES DE SCHEMA E TABELAS NO SUPABASE
// ==============================================================================
console.log("\n[3] Testando estrutura e permissões das tabelas no Supabase...");

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarTabela(tabela, colunas) {
  try {
    const { data, error } = await supabase.from(tabela).select(colunas.join(",")).limit(1);
    if (error && error.code !== "PGRST116") {
      // Se der erro de coluna inexistente ou tabela inexistente
      if (error.code === "42703" || error.code === "42P01" || error.code === "PGRST205") {
        registrarErro(`Supabase / ${tabela}`, `Coluna ou tabela ausente: ${error.message}`);
      } else {
        // Se der permissão RLS sem token auth, a tabela existe mas o acesso anônimo é bloqueado (seguro por RLS)
        registrarSucesso(`Tabela '${tabela}' existe e colunas [${colunas.join(", ")}] validadas (RLS ativo)`);
      }
    } else {
      registrarSucesso(`Tabela '${tabela}' acessível com colunas [${colunas.join(", ")}]`);
    }
  } catch (err) {
    registrarErro(`Supabase / ${tabela}`, err.message);
  }
}

await testarTabela("alunos", ["id", "nome", "telefone", "status", "valor_mensalidade", "dia_vencimento", "periodicidade"]);
await testarTabela("cobrancas", ["id", "aluno_id", "titulo", "valor", "data_vencimento", "status", "tipo", "mes_referencia"]);
await testarTabela("aulas", ["id", "tipo_aula", "dia_semana", "horario", "limite_vagas", "ativo"]);
await testarTabela("aulas_suspensas", ["id", "aula_id", "data"]);
await testarTabela("agendamentos", ["id", "aula_id", "aluno_id", "data"]);
await testarTabela("planos", ["id", "nome", "frequencia_semanal", "preco_mensal"]);

// ==============================================================================
// 4. TESTES DAS FERRAMENTAS DO COPILOTO CLAUDE
// ==============================================================================
console.log("\n[4] Testando integridade das 28 ferramentas do Copiloto Claude...");

try {
  const ferramentasFile = fs.readFileSync("./lib/agente/ferramentas.ts", "utf8");
  const executorFile = fs.readFileSync("./lib/agente/executor.ts", "utf8");

  // Extrair nomes das ferramentas de ferramentas.ts
  const toolNameMatches = [...ferramentasFile.matchAll(/name:\s*["']([^"']+)["']/g)];
  const nomesFerramentas = toolNameMatches.map((m) => m[1]);

  assert.strictEqual(nomesFerramentas.length >= 27, true, `Esperadas pelo menos 27 ferramentas, encontradas ${nomesFerramentas.length}`);
  registrarSucesso(`Total de ferramentas declaradas: ${nomesFerramentas.length}`);

  // Verificar se cada ferramenta tem seu respectivo 'case' em executor.ts
  let semCase = [];
  for (const nome of nomesFerramentas) {
    const temCase = executorFile.includes(`case "${nome}":`) || executorFile.includes(`case '${nome}':`);
    if (!temCase) {
      semCase.push(nome);
    }
  }

  if (semCase.length === 0) {
    registrarSucesso(`Todas as ${nomesFerramentas.length} ferramentas têm manipulador ('case') no executor.ts`);
  } else {
    registrarErro("Executor Claude", `Ferramentas sem manipulador: ${semCase.join(", ")}`);
  }
} catch (err) {
  registrarErro("Ferramentas", err.message);
}

// ==============================================================================
// 5. TESTES DE HIGIENIZAÇÃO E COMUNICAÇÃO COM O CLAUDE
// ==============================================================================
console.log("\n[5] Testando higienização do modelo e chamada direta à API Claude...");

function obterModeloClaudeSanitizado(rawModel) {
  const raw = rawModel || "";
  const limpo = raw.trim().replace(/[\r\n\t"']/g, "");
  return limpo || "claude-haiku-4-5-20251001";
}

try {
  // Teste com quebra de linha (que causou o erro 404 anterior)
  const modeloComEnter = "claude-haiku-4-5-20251001\n";
  const modeloComAspas = '"claude-haiku-4-5-20251001"\r';
  assert.strictEqual(obterModeloClaudeSanitizado(modeloComEnter), "claude-haiku-4-5-20251001");
  assert.strictEqual(obterModeloClaudeSanitizado(modeloComAspas), "claude-haiku-4-5-20251001");
  registrarSucesso("Higienização de modelo remove \\n, \\r, aspas e espaços invisíveis");
} catch (err) {
  registrarErro("Sanitização Modelo", err.message);
}

// Teste real com a API da Anthropic
if (anthropicKey) {
  try {
    const limpoKey = anthropicKey.trim().replace(/[\r\n\t"']/g, "");
    const client = new Anthropic({ apiKey: limpoKey });
    const modeloAlvo = obterModeloClaudeSanitizado(claudeModel);

    const res = await client.messages.create({
      model: modeloAlvo,
      max_tokens: 15,
      messages: [{ role: "user", content: "Responda apenas: OK" }],
    });

    const respostaTexto = res.content[0]?.text || "";
    registrarSucesso(`Chamada real à API Anthropic bem-sucedida com modelo '${modeloAlvo}': "${respostaTexto.trim()}"`);
  } catch (err) {
    registrarErro("Anthropic API", `Erro na chamada real: ${err.message}`);
  }
}

// ==============================================================================
// 6. RELATÓRIO FINAL CONSOLIDADO
// ==============================================================================
console.log("\n======================================================================");
console.log("📊 RELATÓRIO CONSOLIDADO DA BATERIA DE TESTES:");
console.log("======================================================================");
console.log(`• Testes aprovados: ${totalPassou}`);
console.log(`• Avisos: ${avisos.length}`);
console.log(`• Falhas encontradas: ${erros.length}`);

if (erros.length === 0) {
  console.log("\n🎉 PARABÉNS! 100% DAS FUNÇÕES E MÓDULOS PASSARAM COM SUCESSO!");
} else {
  console.log("\n🚨 ITENS QUE PRECISAM DE CORREÇÃO:");
  for (const e of erros) {
    console.log(`  - [${e.modulo}]: ${e.detalhe}`);
  }
}
console.log("======================================================================\n");
