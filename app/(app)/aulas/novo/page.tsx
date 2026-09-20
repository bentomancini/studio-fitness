import { AulaForm } from "../aula-form";

export const metadata = { title: "Nova aula" };

export default function NovaAulaPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Nova aula</h1>
      <AulaForm />
    </div>
  );
}