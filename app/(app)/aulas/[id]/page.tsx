import { buscarAula } from "@/lib/services/aulas";
import { notFound } from "next/navigation";
import { AulaForm } from "../aula-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "Editar Aula" };

export default async function EditarAulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const aula = await buscarAula(id);

  if (!aula) notFound();

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
            Editar Horário
          </h1>
          <p className="text-xs text-zinc-400">
            Atualize modalidade, horário ou vagas de {aula.tipo_aula}
          </p>
        </div>
      </div>

      <AulaForm aula={aula} />
    </div>
  );
}