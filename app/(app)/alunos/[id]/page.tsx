import { buscarAluno } from "@/lib/services/alunos";
import { notFound } from "next/navigation";
import { AlunoForm } from "../aluno-form";

export const metadata = { title: "Editar aluno" };

export default async function EditarAlunoPage({
  params,
}: PageProps<"/alunos/[id]">) {
  const { id } = await params;
  const aluno = await buscarAluno(id);

  if (!aluno) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Editar aluno</h1>
      <AlunoForm aluno={aluno} />
    </div>
  );
}