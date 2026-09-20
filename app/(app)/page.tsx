import { carregarAgenda } from "@/lib/services/agenda";
import { Agenda } from "./agenda/agenda-client";

export const metadata = { title: "Agenda" };

export default async function AppHome() {
  const { aulas, alunos, agendamentos, suspensoes } = await carregarAgenda();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold">Agenda</h1>
      <Agenda
        aulas={aulas}
        alunos={alunos}
        agendamentos={agendamentos}
        suspensoes={suspensoes}
      />
    </div>
  );
}