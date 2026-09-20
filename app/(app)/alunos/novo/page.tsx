import { AlunoForm } from "../aluno-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "Novo Aluno" };

export default function NovoAlunoPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Link
          href="/alunos"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-white transition-colors"
          aria-label="Voltar para lista de alunos"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Novo Aluno
          </h1>
          <p className="text-xs text-zinc-400">
            Cadastre um novo aluno no Intense Fitness
          </p>
        </div>
      </div>

      <AlunoForm />
    </div>
  );
}