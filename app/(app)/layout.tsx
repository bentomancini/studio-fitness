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
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <span className="text-base font-semibold">Studio Fitness</span>
        <form action={signOut}>
          <button
            type="submit"
            className="min-h-11 rounded-xl px-4 text-sm font-medium text-zinc-600"
          >
            Sair
          </button>
        </form>
      </header>
      <nav className="flex gap-1 overflow-x-auto border-b border-zinc-200 px-4 py-2">
        <Link
          href="/"
          className="flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-zinc-700"
        >
          Hoje
        </Link>
        <Link
          href="/agendar"
          className="flex min-h-11 items-center rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-900"
        >
          Agendar
        </Link>
        <Link
          href="/alunos"
          className="flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-zinc-700"
        >
          Alunos
        </Link>
        <Link
          href="/aulas"
          className="flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-zinc-700"
        >
          Aulas
        </Link>
      </nav>
      <main className="flex flex-1 flex-col px-4 py-6">{children}</main>
    </div>
  );
}