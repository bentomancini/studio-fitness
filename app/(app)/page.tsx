import { getCurrentUser } from "@/lib/auth";

export default async function AppHome() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-xl font-bold">Hoje</h1>
      <p className="text-zinc-600">
        Conectado como {user?.email}. A agenda chega em uma próxima etapa.
      </p>
    </div>
  );
}