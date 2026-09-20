import { buscarAluno } from "@/lib/services/alunos";
import { notFound } from "next/navigation";
import { AlunoForm } from "../../aluno-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "Editar Ficha do Aluno" };

export default async function EditarAlunoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const aluno = await buscarAluno(id);

  if (!aluno) notFound();

  return (
    <div className="flex flex-col gap-5 pb-8">
      <div className="flex items-center gap-2.5">
        <Link
          href={`/alunos/${aluno.id}`}
          className="btn-press flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-white transition-colors"
          aria-label="Voltar para a ficha do aluno"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Editar Ficha
          </h1>
          <p className="text-xs text-zinc-400">
            Atualize os dados e o perfil de {aluno.nome}
          </p>
        </div>
      </div>

      <AlunoForm aluno={aluno} />
    </div>
  );
}
