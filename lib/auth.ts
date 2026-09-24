import { createClient } from "@/lib/supabase/server";
import { isDono } from "@/lib/dono";
import { cache } from "react";

/**
 * Valida a identidade do dono com cache por renderização.
 * Em projetos com JWT assimétrico, getClaims verifica a assinatura localmente
 * (após carregar as chaves públicas), sem consultar o Auth em cada navegação.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub || !isDono(data.claims.sub)) return null;
  return data.claims;
});
