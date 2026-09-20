import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isDono } from "@/lib/dono";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/login";

  // Identifica requisições de prefetch do Next.js
  const isPrefetch =
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch";

  // Checa se o usuário possui cookie de autenticação do Supabase
  const cookiesList = request.cookies.getAll();
  const hasAuthCookie = cookiesList.some((c) => c.name.includes("-auth-token"));

  // 1. Otimização de Rota Não-Autenticada (Zero Latência):
  // Se não tem cookie de auth e já está no /login, libera imediatamente em 0ms
  if (!hasAuthCookie && isLoginPage) {
    return NextResponse.next();
  }

  // Se não tem cookie de auth e tenta acessar rota protegida, redireciona para /login em 0ms
  if (!hasAuthCookie && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2. Otimização para Prefetches do Next.js:
  // Se já possui cookie e é apenas um prefetch de página interna, libera em 0ms sem bloquear no Supabase
  if (isPrefetch && !isLoginPage) {
    return NextResponse.next();
  }

  // 3. Verificação de Sessão (Apenas para navegações reais com cookie)
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && !isDono(user.id)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};