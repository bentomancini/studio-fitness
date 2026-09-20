import { createClient } from "@supabase/supabase-js";

const url = "https://qsblaxrwivhhwpgaoabv.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzYmxheHJ3aXZoaHdwZ2FvYWJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NjY1NTgsImV4cCI6MjEwNTQ0MjU1OH0.N0X4jA1q71tmJB5spM6PWV5tU2YtTE20SX19JWqOk2Q";

const supabase = createClient(url, anonKey);

async function check() {
  console.log("Checking Supabase alunos table...");
  const res1 = await supabase.from("alunos").select("id, nome, telefone, status").limit(1);
  console.log("Query core fields (id, nome, telefone, status):", res1.error ? JSON.stringify(res1.error) : "OK, rows: " + res1.data?.length);

  const res2 = await supabase.from("alunos").select("id, nome, data_nascimento").limit(1);
  console.log("Query new field (data_nascimento):", res2.error ? JSON.stringify(res2.error) : "OK, rows: " + res2.data?.length);
}

check();
