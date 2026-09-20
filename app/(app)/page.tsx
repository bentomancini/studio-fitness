import { exigeLogin } from "@/lib/exige-login";
import { Agenda } from "./agenda/agenda-client";

export const metadata = { title: "Agenda" };

function textoData(valor: unknown) {
  if (typeof valor === "string") return valor.slice(0, 10);
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  return "";
}

export default async function AppHome() {
  const supabase = await exigeLogin();

  const [{ data: aulas }, { data: alunos }, { data: agendamentos }, { data: suspensoes }] =
    await Promise.all([
      supabase
        .from("aulas")
        .select("id, tipo_aula, dia_semana, horario, limite_vagas")
        .eq("ativo", true),
      supabase
        .from("alunos")
        .select("id, nome")
        .eq("status", "ativo"),
      supabase.from("agendamentos").select("aula_id, aluno_id, data"),
      supabase.from("aulas_suspensas").select("aula_id, data"),
    ]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold">Agenda</h1>
      <Agenda
        aulas={(aulas ?? []).map((a) => ({
          id: a.id,
          tipo_aula: a.tipo_aula,
          dia_semana: a.dia_semana,
          horario: a.horario,
          limite_vagas: a.limite_vagas,
        }))}
        alunos={(alunos ?? []).map((a) => ({ id: a.id, nome: a.nome }))}
        agendamentos={(agendamentos ?? []).map((g) => ({
          aula_id: g.aula_id,
          aluno_id: g.aluno_id,
          data: textoData(g.data),
        }))}
        suspensoes={(suspensoes ?? []).map((s) => ({
          aula_id: s.aula_id,
          data: textoData(s.data),
        }))}
      />
    </div>
  );
}