import { createClient } from "@/lib/supabase/server";
import { isDono } from "@/lib/dono";
import { redirect } from "next/navigation";
import { cache } from "react";

/**
 * Garante que só o dono logado chega às páginas e serviços.
 * Usando React cache(), todas as chamadas na mesma requisição (layout, página e serviços)
 * compartilham o mesmo cliente autenticado, eliminando 3 a 4 chamadas lentas ao Supabase.
 */
export const exigeDono = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isDono(user.id)) redirect("/login");
  return supabase;
});

export const exigeLogin = exigeDono;