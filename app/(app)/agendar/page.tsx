import { carregarAgenda } from "@/lib/services/agenda";
import { Agendamento } from "./agendamento-client";

export const metadata = { title: "Agendar" };

export default async function AgendarPage() {
  const { aulas, alunos, agendamentos, suspensoes } = await carregarAgenda();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Agendar</h1>
      <Agendamento
        alunos={alunos}
        aulas={aulas}
        agendamentos={agendamentos}
        suspensoes={suspensoes}
      />
    </div>
  );
}