import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

nextEnv.loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY antes de verificar o banco.");
  process.exit(1);
}

let papel = "";
if (anonKey.startsWith("sb_publishable_")) {
  papel = "anon";
} else {
  try {
    papel = JSON.parse(Buffer.from(anonKey.split(".")[1], "base64url").toString("utf8")).role;
  } catch {
    // Chave inválida ou não reconhecida.
  }
}
if (papel !== "anon") {
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY não é uma chave pública anon/publishable. Não a use no navegador.");
  process.exit(1);
}

const supabase = createClient(url, anonKey, { auth: { persistSession: false } });

const rpc = await supabase.rpc("dono_id");
if (!rpc.error) {
  console.error("ATENÇÃO: usuários anônimos ainda podem executar dono_id(). Aplique a migração 009.");
  process.exitCode = 1;
} else if (["42501", "PGRST202"].includes(rpc.error.code)) {
  console.log("OK: dono_id() não pode ser executada anonimamente.");
} else {
  console.error("Não foi possível confirmar a permissão de dono_id():", rpc.error.code);
  process.exitCode = 1;
}

for (const tabela of ["alunos", "cobrancas", "config"]) {
  const { data, error } = await supabase.from(tabela).select(tabela === "config" ? "chave" : "id").limit(1);
  if (error) {
    console.error(`Não foi possível testar leitura anônima de ${tabela}:`, error.code);
    process.exitCode = 1;
  } else if (data.length) {
    console.error(`ATENÇÃO: leitura anônima permitida em ${tabela}. Verifique as políticas RLS.`);
    process.exitCode = 1;
  } else {
    console.log(`${tabela}: nenhuma linha retornada ao cliente anônimo (inconclusivo se a tabela estiver vazia).`);
  }
}
