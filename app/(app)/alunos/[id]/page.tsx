import { exigeLogin } from "@/lib/exige-login";
import { notFound } from "next/navigation";
import { AlunoForm } from "../aluno-form";

export const metadata = { title: "Editar aluno" };

export default async function EditarAlunoPage({
  params,
}: PageProps<"/alunos/[id]">) {
  const { id } = await params;
  const supabase = await exigeLogin();

  const { data: aluno } = await supabase
    .from("alunos")
    .select("id, nome, telefone, observacoes, status")
    .eq("id", id)
    .single();

  if (!aluno) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Editar aluno</h1>
      <AlunoForm aluno={aluno} />
    </div>
  );
}