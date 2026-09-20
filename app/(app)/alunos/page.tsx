import { exigeLogin } from "@/lib/exige-login";
import Link from "next/link";
import { alternarStatus } from "./actions";
import { BotaoExcluirAluno } from "./botao-excluir";

export const metadata = { title: "Alunos" };

export default async function AlunosPage() {
  const supabase = await exigeLogin();

  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome, telefone, status")
    .order("nome");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Alunos</h1>
        <Link
          href="/alunos/novo"
          className="min-h-11 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white flex items-center"
        >
          Novo aluno
        </Link>
      </div>

      {!alunos || alunos.length === 0 ? (
        <p className="rounded-xl bg-zinc-50 px-4 py-6 text-center text-zinc-600">
          Nenhum aluno cadastrado ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {alunos.map((aluno) => (
            <li
              key={aluno.id}
              className="rounded-xl border border-zinc-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{aluno.nome}</p>
                  <p className="text-sm text-zinc-600">
                    {aluno.telefone || "Sem telefone"}
                  </p>
                </div>
                <span
                  className={
                    aluno.status === "ativo"
                      ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                      : "rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600"
                  }
                >
                  {aluno.status === "ativo" ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                <Link
                  href={`/alunos/${aluno.id}`}
                  className="min-h-11 rounded-xl px-4 text-sm font-medium text-zinc-700 flex items-center"
                >
                  Editar
                </Link>
                <div className="flex items-center gap-1">
                  <form action={alternarStatus.bind(null, aluno.id, aluno.status)}>
                    <button
                      type="submit"
                      className="min-h-11 rounded-xl px-3 text-sm font-medium text-zinc-700"
                    >
                      {aluno.status === "ativo" ? "Inativar" : "Ativar"}
                    </button>
                  </form>
                  <BotaoExcluirAluno id={aluno.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}