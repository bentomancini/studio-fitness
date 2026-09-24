import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

function carregarEnvLocal() {
  const env = {};
  try {
    const content = fs.readFileSync(".env.local", "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const idx = trimmed.indexOf("=");
        if (idx > -1) {
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
          env[k] = v;
        }
      }
    }
  } catch {
    // .env.local ausente
  }
  return env;
}

const envVars = carregarEnvLocal();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Credenciais do Supabase ausentes. Copie .env.example para .env.local e preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(url, anonKey);

async function check() {
  console.log("Checking Supabase alunos table...");
  const res1 = await supabase.from("alunos").select("id, nome, telefone, status").limit(1);
  console.log("Query core fields (id, nome, telefone, status):", res1.error ? JSON.stringify(res1.error) : "OK, rows: " + res1.data?.length);

  const res2 = await supabase.from("alunos").select("id, nome, data_nascimento").limit(1);
  console.log("Query new field (data_nascimento):", res2.error ? JSON.stringify(res2.error) : "OK, rows: " + res2.data?.length);
}

check();
