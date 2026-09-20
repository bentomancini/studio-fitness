import { AlunoForm } from "../aluno-form";

export const metadata = { title: "Novo aluno" };

export default function NovoAlunoPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Novo aluno</h1>
      <AlunoForm />
    </div>
  );
}