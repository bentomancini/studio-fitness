"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CalendarPlus, Users, Clock } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/",
      label: "Agenda",
      icon: Calendar,
      isActive: pathname === "/",
    },
    {
      href: "/agendar",
      label: "Agendar",
      icon: CalendarPlus,
      isActive: pathname === "/agendar",
    },
    {
      href: "/alunos",
      label: "Alunos",
      icon: Users,
      isActive: pathname.startsWith("/alunos"),
    },
    {
      href: "/aulas",
      label: "Aulas",
      icon: Clock,
      isActive: pathname.startsWith("/aulas"),
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-3 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1 transition-all ${
                active
                  ? "text-emerald-400"
                  : "text-zinc-400 hover:text-zinc-200 active:scale-95"
              }`}
            >
              {/* Indicador de aba ativa */}
              {active && (
                <span
                  className="absolute -top-1.5 h-1 w-8 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]"
                  aria-hidden
                />
              )}
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all ${
                  active ? "bg-emerald-500/15" : ""
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform ${
                    active ? "scale-110 stroke-[2.4]" : "stroke-[1.8]"
                  }`}
                />
              </div>
              <span
                className={`text-[11px] font-medium tracking-tight ${
                  active ? "font-semibold text-emerald-300" : "text-zinc-400"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
