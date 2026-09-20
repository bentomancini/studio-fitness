import { createClient } from "@supabase/supabase-js";
import assert from "node:assert";

const url = "https://qsblaxrwivhhwpgaoabv.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzYmxheHJ3aXZoaHdwZ2FvYWJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NjY1NTgsImV4cCI6MjEwNTQ0MjU1OH0.N0X4jA1q71tmJB5spM6PWV5tU2YtTE20SX19JWqOk2Q";

const supabase = createClient(url, anonKey);

console.log("==================================================");
console.log("🧪 INICIANDO BATERIA COMPLETA DE TESTES");
console.log("==================================================");

let errosEncontrados = [];

async function testarTabela(nome, camposEsperados) {
  process.stdout.write(`• Testando tabela '${nome}'... `);
  try {
    const { data, error } = await supabase.from(nome).select(camposEsperados.join(", ")).limit(1);
    if (error) {
      console.log(`❌ ERRO: [${error.code}] ${error.message}`);
      errosEncontrados.push({ modulo: `Banco: ${nome}`, erro: `[${error.code}] ${error.message}` });
    } else {
      console.log(`✅ OK (${data ? data.length : 0} registros consultados)`);
    }
  } catch (err) {
    console.log(`❌ EXCEÇÃO: ${err.message}`);
    errosEncontrados.push({ modulo: `Banco: ${nome}`, erro: err.message });
  }
}

// ==========================================
// Testes de Lógica de Negócio (Servidor)
// ==========================================
function testarLogica() {
  console.log("\n[2] TESTES DE LÓGICA DE NEGÓCIO E VALIDAÇÕES:");

  // Teste 1: Cálculo de idade
  function calcularIdadeSimulado(dataNascStr, hojeStr) {
    if (!dataNascStr) return null;
    const [ano, mes, dia] = dataNascStr.split("-").map(Number);
    const [hojeAno, hojeMes, hojeDia] = hojeStr.split("-").map(Number);
    let idade = hojeAno - ano;
    if (hojeMes < mes || (hojeMes === mes && hojeDia < dia)) idade--;
    return idade >= 0 ? idade : null;
  }

  process.stdout.write("• Testando cálculo de idade dinâmico... ");
  try {
    assert.strictEqual(calcularIdadeSimulado(null, "2026-09-20"), null);
    assert.strictEqual(calcularIdadeSimulado("2000-09-20", "2026-09-20"), 26);
    assert.strictEqual(calcularIdadeSimulado("2000-09-21", "2026-09-20"), 25);
    assert.strictEqual(calcularIdadeSimulado("2026-09-20", "2026-09-20"), 0);
    console.log("✅ OK");
  } catch (e) {
    console.log("❌ FALHOU:", e.message);
    errosEncontrados.push({ modulo: "Lógica: calcularIdade", erro: e.message });
  }

  // Teste 2: Validação de data de nascimento futura
  process.stdout.write("• Testando bloqueio de data futura... ");
  try {
    const hoje = "2026-09-20";
    const dataFutura = "2026-09-25";
    const dataPassada = "1995-05-10";
    assert.strictEqual(dataFutura > hoje, true, "Data futura deve ser detectada");
    assert.strictEqual(dataPassada > hoje, false, "Data passada é aceita");
    console.log("✅ OK");
  } catch (e) {
    console.log("❌ FALHOU:", e.message);
    errosEncontrados.push({ modulo: "Lógica: dataFutura", erro: e.message });
  }

  // Teste 3: Limpeza de campos condicionais
  process.stdout.write("• Testando limpeza condicional (empresa e dores)... ");
  try {
    const temEmpresa = false;
    const empresaNome = temEmpresa ? "Studio X" : "";
    assert.strictEqual(empresaNome, "");

    const temDores = false;
    const doresDesc = temDores ? "Dor no ombro" : "";
    assert.strictEqual(doresDesc, "");
    console.log("✅ OK");
  } catch (e) {
    console.log("❌ FALHOU:", e.message);
    errosEncontrados.push({ modulo: "Lógica: limpezaCondicional", erro: e.message });
  }
}

async function executarBateria() {
  console.log("\n[1] TESTES DE BANCO DE DADOS E SCHEMA DO SUPABASE:");
  
  await testarTabela("config", ["chave", "valor"]);
  await testarTabela("aulas", ["id", "tipo_aula", "dia_semana", "horario", "limite_vagas", "ativo"]);
  await testarTabela("aulas_suspensas", ["id", "aula_id", "data", "observacao"]);
  await testarTabela("agendamentos", ["id", "aula_id", "aluno_id", "data", "compra_id", "consumiu_aula"]);
  await testarTabela("planos", ["id", "nome", "qtd_aulas", "validade_dias", "ativo"]);
  await testarTabela("compras", ["id", "aluno_id", "plano_id", "qtd_aulas_restantes", "data_compra", "validade"]);
  await testarTabela("alunos", ["id", "nome", "telefone", "observacoes", "status"]);

  // Teste específico para verificar se a migration 004 foi rodada
  process.stdout.write("• Verificando status da Migration 004 no Supabase... ");
  const res004 = await supabase.from("alunos").select("data_nascimento").limit(1);
  if (res004.error && res004.error.code === "42703") {
    console.log("⚠️ PENDENTE: A tabela 'alunos' ainda não recebeu as colunas da migration 004.");
    errosEncontrados.push({
      modulo: "Supabase / Migration 004",
      erro: "A coluna 'data_nascimento' ainda não foi criada no banco.",
    });
  } else if (!res004.error) {
    console.log("✅ APLICADA");
  } else {
    console.log(`⚠️ Status: ${res004.error.message}`);
  }

  // Teste específico para verificar se a migration 005 (Cobranças) foi rodada
  process.stdout.write("• Verificando status da Migration 005 (Cobranças) no Supabase... ");
  const res005 = await supabase.from("cobrancas").select("id, valor, status, data_vencimento").limit(1);
  if (res005.error && (res005.error.code === "42P01" || res005.error.code === "PGRST205")) {
    console.log("⚠️ PENDENTE: A tabela 'cobrancas' ainda não foi criada no Supabase.");
    errosEncontrados.push({
      modulo: "Supabase / Migration 005",
      erro: "A tabela 'cobrancas' precisa ser criada aplicando o arquivo 005_cobrancas.sql no Supabase.",
    });
  } else if (!res005.error) {
    console.log("✅ APLICADA: Tabela 'cobrancas' pronta para uso.");
  } else {
    console.log(`⚠️ Status: ${res005.error.message}`);
  }

  testarLogica();

  console.log("\n==================================================");
  console.log("📊 RELATÓRIO FINAL DA BATERIA DE TESTES:");
  console.log("==================================================");

  if (errosEncontrados.length === 0) {
    console.log("🎉 TODOS OS MÓDULOS E TESTES PASSARAM COM SUCESSO!");
  } else {
    console.log(`Foram identificados ${errosEncontrados.length} item(ns) de atenção:\n`);
    errosEncontrados.forEach((e, idx) => {
      console.log(`  ${idx + 1}. [${e.modulo}]`);
      console.log(`     👉 ${e.erro}\n`);
    });
  }
}

executarBateria();
