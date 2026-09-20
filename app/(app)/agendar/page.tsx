import { carregarAgenda } from "@/lib/services/agenda";
import { Agendamento } from "./agendamento-client";

export const metadata = { title: "Agendar Aula" };

export default async function AgendarPage() {
  const { aulas, alunos, agendamentos, suspensoes } = await carregarAgenda();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Agendar Aula
        </h1>
        <p className="text-xs text-zinc-400">
          Selecione o aluno, a data e confirme a vaga na aula desejada
        </p>
      </div>

      <Agendamento
        alunos={alunos}
        aulas={aulas}
        agendamentos={agendamentos}
        suspensoes={suspensoes}
      />
    </div>
  );
}