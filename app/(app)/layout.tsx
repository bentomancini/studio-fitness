import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "./actions";
import { BottomNav } from "./bottom-nav";
import { obterQtdCobrancasPendentesAlerta } from "@/lib/services/cobrancas";
import { Dumbbell, LogOut } from "lucide-react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let qtdCobrancasAlerta = 0;
  try {
    qtdCobrancasAlerta = await obterQtdCobrancasPendentesAlerta();
  } catch {
    // Falha tolerante caso o banco esteja carregando
  }

  return (
    <div className="flex h-full min-h-dvh flex-1 flex-col bg-zinc-950 text-zinc-100">
      {/* Cabeçalho translúcido moderno */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-zinc-950/80 px-4 py-2.5 pt-[calc(env(safe-area-inset-top)+0.6rem)] backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20">
            <Dumbbell className="h-4 w-4 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-white">
              Studio Brenno Mancini
            </span>
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              Admin
            </span>
          </div>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sair da conta"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/30 hover:bg-red-950/40 hover:text-red-300 active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair</span>
          </button>
        </form>
      </header>

      {/* Conteúdo principal com limite ergonômico no mobile */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5 pb-28">
        {children}
      </main>

      {/* Barra de navegação inferior estilo dock iOS */}
      <BottomNav qtdCobrancasAlerta={qtdCobrancasAlerta} />
    </div>
  );
}