import { exigeLogin } from "@/lib/exige-login";
import { DIAS_SEMANA, formatoHorario } from "@/lib/constantes";
import Link from "next/link";
import { alternarAtiva } from "./actions";
import { BotaoExcluirAula } from "./botao-excluir";

export const metadata = { title: "Aulas" };

type Aula = {
  id: string;
  tipo_aula: string;
  dia_semana: number;
  horario: string;
  limite_vagas: number;
  ativo: boolean;
};

export default async function AulasPage() {
  const supabase = await exigeLogin();

  const { data: aulas } = await supabase
    .from("aulas")
    .select("id, tipo_aula, dia_semana, horario, limite_vagas, ativo")
    .order("dia_semana")
    .order("horario");

  const porDia = Array.from({ length: 7 }, (_, i) => ({
    dia: i,
    aulas: (aulas ?? []).filter((a: Aula) => a.dia_semana === i),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Aulas</h1>
        <Link
          href="/aulas/novo"
          className="flex min-h-11 items-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white"
        >
          Novo horário
        </Link>
      </div>

      {!aulas || aulas.length === 0 ? (
        <p className="rounded-xl bg-zinc-50 px-4 py-6 text-center text-zinc-600">
          Nenhum horário de aula cadastrado ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {porDia
            .filter((d) => d.aulas.length > 0)
            .map((grupo) => (
              <section key={grupo.dia}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  {DIAS_SEMANA[grupo.dia]}
                </h2>
                <ul className="flex flex-col gap-3">
                  {grupo.aulas.map((aula: Aula) => (
                    <li key={aula.id} className="rounded-xl border border-zinc-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{aula.tipo_aula}</p>
                          <p className="text-sm text-zinc-600">
                            {formatoHorario(aula.horario)} ·{" "}
                            {aula.limite_vagas} vagas
                          </p>
                        </div>
                        <span
                          className={
                            aula.ativo
                              ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                              : "rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600"
                          }
                        >
                          {aula.ativo ? "Ativa" : "Inativa"}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                        <Link
                          href={`/aulas/${aula.id}`}
                          className="flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-zinc-700"
                        >
                          Editar
                        </Link>
                        <div className="flex items-center gap-1">
                          <form action={alternarAtiva.bind(null, aula.id, aula.ativo)}>
                            <button
                              type="submit"
                              className="min-h-11 rounded-xl px-3 text-sm font-medium text-zinc-700"
                            >
                              {aula.ativo ? "Inativar" : "Ativar"}
                            </button>
                          </form>
                          <BotaoExcluirAula id={aula.id} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}