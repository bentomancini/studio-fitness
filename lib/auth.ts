import { createClient } from "@/lib/supabase/server";
import { isDono } from "@/lib/dono";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || !isDono(user.id)) return null;
  return user;
}