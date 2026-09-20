import { AulaForm } from "../aula-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "Novo Horário de Aula" };

export default function NovaAulaPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Link
          href="/aulas"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-white transition-colors"
          aria-label="Voltar para grade de aulas"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Novo Horário
          </h1>
          <p className="text-xs text-zinc-400">
            Configure uma nova aula na programação semanal
          </p>
        </div>
      </div>

      <AulaForm />
    </div>
  );
}