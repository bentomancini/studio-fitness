import { exigeLogin } from "@/lib/exige-login";
import { notFound } from "next/navigation";
import { AulaForm } from "../aula-form";

export const metadata = { title: "Editar aula" };

export default async function EditarAulaPage({
  params,
}: PageProps<"/aulas/[id]">) {
  const { id } = await params;
  const supabase = await exigeLogin();

  const { data: aula } = await supabase
    .from("aulas")
    .select("id, tipo_aula, dia_semana, horario, limite_vagas")
    .eq("id", id)
    .single();

  if (!aula) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Editar aula</h1>
      <AulaForm aula={aula} />
    </div>
  );
}