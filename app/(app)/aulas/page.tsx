import { listarAulas } from "@/lib/services/aulas";
import { DIAS_SEMANA, formatoHorario } from "@/lib/constantes";
import Link from "next/link";
import { BotaoExcluirAula } from "./botao-excluir";
import { BotaoAlternarAula } from "./botao-alternar-aula";
import {
  Clock,
  Plus,
  Edit3,
  Users,
  Dumbbell,
} from "lucide-react";

export const metadata = { title: "Grade de Aulas" };

type Aula = {
  id: string;
  tipo_aula: string;
  dia_semana: number;
  horario: string;
  limite_vagas: number;
  ativo: boolean;
};

export default async function AulasPage() {
  const aulas = await listarAulas();

  const porDia = Array.from({ length: 7 }, (_, i) => ({
    dia: i,
    nome: DIAS_SEMANA[i],
    aulas: aulas.filter((a: Aula) => a.dia_semana === i),
  }));

  const totalAtivas = aulas.filter((a: Aula) => a.ativo).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho da página */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Grade de Aulas
          </h1>
          <p className="text-xs text-zinc-400">
            {totalAtivas} horários ativos configurados
          </p>
        </div>
        <Link
          href="/aulas/novo"
          className="btn-press flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-3.5 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Novo Horário</span>
        </Link>
      </div>

      {aulas.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-8 text-center">
          <Dumbbell className="mb-3 h-8 w-8 text-zinc-600 stroke-[1.5]" />
          <h3 className="text-sm font-semibold text-white">
            Nenhuma aula cadastrada
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Cadastre os horários fixos de funcionamento e limites de vagas da semana.
          </p>
          <Link
            href="/aulas/novo"
            className="mt-4 flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-5 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Cadastrar primeiro horário
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {porDia
            .filter((d) => d.aulas.length > 0)
            .map((grupo) => (
              <section key={grupo.dia} className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    {grupo.nome}
                  </h2>
                  <span className="text-[11px] text-zinc-500">
                    {grupo.aulas.length} {grupo.aulas.length === 1 ? "aula" : "aulas"}
                  </span>
                </div>

                <ul className="flex flex-col gap-3">
                  {grupo.aulas.map((aula: Aula) => (
                    <li
                      key={aula.id}
                      className={`glass-panel interactive-card relative overflow-hidden rounded-3xl p-4 border transition-all ${
                        aula.ativo
                          ? "border-white/10 hover:border-white/20"
                          : "border-white/5 bg-zinc-950/40 opacity-70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatoHorario(aula.horario)}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white tracking-tight">
                              {aula.tipo_aula}
                            </h3>
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
                              <Users className="h-3 w-3 text-zinc-500" />
                              <span>{aula.limite_vagas} vagas disponíveis</span>
                            </div>
                          </div>
                        </div>

                        {/* Badge ativo/inativo */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                            aula.ativo
                              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                              : "border-white/10 bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              aula.ativo ? "bg-emerald-400" : "bg-zinc-500"
                            }`}
                          />
                          {aula.ativo ? "Ativa" : "Inativa"}
                        </span>
                      </div>

                      {/* Rodapé de Ações */}
                      <div className="mt-3.5 flex items-center justify-between border-t border-white/5 pt-3">
                        <Link
                          href={`/aulas/${aula.id}`}
                          className="btn-press flex h-8 items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/80 px-3 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                        >
                          <Edit3 className="h-3 w-3 text-zinc-400" />
                          <span>Editar</span>
                        </Link>

                        <div className="flex items-center gap-1">
                          <BotaoAlternarAula
                            id={aula.id}
                            ativa={aula.ativo}
                          />
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