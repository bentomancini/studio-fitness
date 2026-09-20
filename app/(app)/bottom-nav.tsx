"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  CalendarPlus,
  CircleDollarSign,
  Users,
  Clock,
} from "lucide-react";

type BottomNavProps = {
  qtdCobrancasAlerta?: number;
};

export function BottomNav({ qtdCobrancasAlerta = 0 }: BottomNavProps) {
  const pathname = usePathname();
  // Estado otimista para feedback instantâneo ao tocar
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const activePath = pendingPath && pendingPath !== pathname ? pendingPath : pathname;

  const tabs = [
    {
      href: "/",
      label: "Agenda",
      icon: Calendar,
      isActive: activePath === "/",
    },
    {
      href: "/agendar",
      label: "Agendar",
      icon: CalendarPlus,
      isActive: activePath === "/agendar",
    },
    {
      href: "/cobrancas",
      label: "Cobranças",
      icon: CircleDollarSign,
      isActive: activePath.startsWith("/cobrancas"),
      badge: qtdCobrancasAlerta,
    },
    {
      href: "/alunos",
      label: "Alunos",
      icon: Users,
      isActive: activePath.startsWith("/alunos"),
    },
    {
      href: "/aulas",
      label: "Aulas",
      icon: Clock,
      isActive: activePath.startsWith("/aulas"),
    },
  ];

  return (
    <>
      {/* Barra de progresso sutil no topo durante transição de abas */}
      {pendingPath !== null && (
        <div
          className="fixed inset-x-0 top-0 z-50 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-[0_0_8px_#10b981] animate-pulse"
          aria-hidden
        />
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.isActive;
            const hasBadge = Boolean(tab.badge && tab.badge > 0);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => {
                  if (pathname !== tab.href) {
                    setPendingPath(tab.href);
                  }
                }}
                className={`btn-press relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1 transition-all ${
                  active
                    ? "text-emerald-400"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {/* Indicador de aba ativa no topo */}
                {active && (
                  <span
                    className="absolute -top-1.5 h-1 w-7 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]"
                    aria-hidden
                  />
                )}

                {/* Ícone com badge flutuante */}
                <div className="relative">
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

                  {hasBadge && (
                    <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-extrabold text-white shadow-sm shadow-rose-500/50">
                      {tab.badge! > 9 ? "9+" : tab.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] font-medium tracking-tight ${
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
    </>
  );
}
