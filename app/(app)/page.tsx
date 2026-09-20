import { carregarAgenda } from "@/lib/services/agenda";
import { Agenda } from "./agenda/agenda-client";

export const metadata = { title: "Agenda" };

export default async function AppHome() {
  const { aulas, alunos, agendamentos, suspensoes } = await carregarAgenda();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Agenda do Estúdio
        </h1>
        <p className="text-xs text-zinc-400">
          Horários, ocupação de vagas e alunos confirmados
        </p>
      </div>

      <Agenda
        aulas={aulas}
        alunos={alunos}
        agendamentos={agendamentos}
        suspensoes={suspensoes}
      />
    </div>
  );
}