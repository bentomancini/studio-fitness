import { listarAlunos } from "@/lib/services/alunos";
import { AlunosClient } from "./alunos-client";

export const metadata = { title: "Alunos" };

export default async function AlunosPage() {
  const alunos = await listarAlunos();

  return <AlunosClient alunos={alunos} />;
}