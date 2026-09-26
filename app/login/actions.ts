"use server";

import { createClient } from "@/lib/supabase/server";
import { isDono } from "@/lib/dono";
import { redirect } from "next/navigation";

export type LoginState = { error?: string };

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Preencha e-mail e senha." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user || !isDono(data.user.id)) {
    if (data?.user) await supabase.auth.signOut();
    return { error: "E-mail ou senha incorretos." };
  }

  redirect("/");
}
