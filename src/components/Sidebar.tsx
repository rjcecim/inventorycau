"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Monitor,
  PcCase,
  Building2,
  MapPin,
  ArrowLeftRight,
  BarChart3,
  Users,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Visão",
    items: [{ href: "/", icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    label: "Inventário",
    items: [
      { href: "/computadores", icon: PcCase, label: "Computadores" },
      { href: "/monitores", icon: Monitor, label: "Monitores" },
    ],
  },
  {
    label: "Organização",
    items: [
      { href: "/departamentos", icon: Building2, label: "Setores" },
      { href: "/usuarios", icon: Users, label: "Usuários" },
      { href: "/localizacoes", icon: MapPin, label: "Prédios" },
    ],
  },
  {
    label: "Operação",
    items: [
      { href: "/movimentacoes", icon: ArrowLeftRight, label: "Movimentações" },
      { href: "/relatorios", icon: BarChart3, label: "Relatórios" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ userName, userRole }: { userName?: string | null; userRole?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-slate-300">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-xs font-bold text-white">CAU</div>
        <div>
          <p className="text-sm font-semibold text-white">CAU Ativos</p>
          <p className="text-xs text-slate-400">Inventário de TI</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition",
                        active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="flex items-center gap-2 border-t border-white/10 px-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{userName}</p>
          <p className="text-xs text-slate-500">{userRole === "ADMIN" ? "Administrador" : "Usuário"}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
