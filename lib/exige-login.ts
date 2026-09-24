import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cache } from "react";

/**
 * Garante que só o dono logado chega às páginas e serviços.
 * Compartilha a checagem de sessão com o layout e reutiliza o cliente entre serviços
 * da mesma renderização, sem repetir a chamada remota a getUser().
 */
export const exigeDono = cache(async () => {
  if (!(await getCurrentUser())) redirect("/login");
  const supabase = await createClient();
  return supabase;
});

export const exigeLogin = exigeDono;
