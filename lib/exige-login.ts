import { createClient } from "@/lib/supabase/server";
import { isDono } from "@/lib/dono";
import { redirect } from "next/navigation";

// Garante que só o dono logado chega às páginas e serviços.
export async function exigeDono() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isDono(user.id)) redirect("/login");
  return supabase;
}

// Mantido apenas por compatibilidade com código antigo.
export async function exigeLogin() {
  return exigeDono();
}