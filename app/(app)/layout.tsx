import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "./actions";

export default async function AppLayout({
  children,
}: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <span className="text-base font-semibold">Studio Fitness</span>
        <form action={signOut}>
          <button
            type="submit"
            className="min-h-11 rounded-xl px-4 text-sm font-medium text-zinc-600"
          >
            Sair
          </button>
        </form>
      </header>
      <main className="flex flex-1 flex-col px-4 py-6">{children}</main>
    </div>
  );
}