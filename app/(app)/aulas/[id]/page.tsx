import { buscarAula } from "@/lib/services/aulas";
import { notFound } from "next/navigation";
import { AulaForm } from "../aula-form";

export const metadata = { title: "Editar aula" };

export default async function EditarAulaPage({
  params,
}: PageProps<"/aulas/[id]">) {
  const { id } = await params;
  const aula = await buscarAula(id);

  if (!aula) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Editar aula</h1>
      <AulaForm aula={aula} />
    </div>
  );
}