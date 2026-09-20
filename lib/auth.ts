import { createClient } from "@/lib/supabase/server";
import { isDono } from "@/lib/dono";
import { cache } from "react";

/**
 * Retorna o usuário logado com cache de requisição (React cache).
 * Se chamado múltiplas vezes no mesmo render, executa a checagem remota apenas uma vez.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || !isDono(user.id)) return null;
  return user;
});