import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "./actions";

export default async function AppLayout({
  children,
}: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-full min-h-dvh flex-1 flex-col">
      {/* Cabeçalho: só o essencial para não roubar espaço vertical */}
      <header className="flex items-center justify-between border-b border-zinc-200 px-5 pt-[env(safe-area-inset-top)]">
        <span className="py-3 text-base font-semibold">Studio Fitness</span>
        <form action={signOut}>
          <button
            type="submit"
            className="min-h-11 rounded-xl px-4 text-sm font-medium text-zinc-600"
          >
            Sair
          </button>
        </form>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">{children}</main>

      {/* Barra inferior de navegação (polegar no iPhone), com area segura */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-md items-stretch gap-1 px-2 py-1">
          <Link
            href="/"
            className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold text-zinc-900"
          >
            <span aria-hidden className="text-lg leading-none">◆</span>
            Hoje
          </Link>
          <Link
            href="/agendar"
            className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium text-zinc-500"
          >
            <span aria-hidden className="text-lg leading-none">＋</span>
            Agendar
          </Link>
          <Link
            href="/alunos"
            className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium text-zinc-500"
          >
            <span aria-hidden className="text-lg leading-none">👥</span>
            Alunos
          </Link>
          <Link
            href="/aulas"
            className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium text-zinc-500"
          >
            <span aria-hidden className="text-lg leading-none">⏱</span>
            Aulas
          </Link>
        </div>
      </nav>
    </div>
  );
}