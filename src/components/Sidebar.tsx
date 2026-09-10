"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Table2,
  Monitor,
  PcCase,
  Building2,
  MapPin,
  ArrowLeftRight,
  BarChart3,
  Users,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "cau-sidebar-collapsed";

const groups = [
  {
    label: "Visão",
    items: [
      { href: "/", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/visao-geral", icon: Table2, label: "Visão Geral" },
    ],
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const initial = (userName ?? "U").trim().charAt(0).toUpperCase() || "U";

  return (
    <aside
      className={cn(
        "relative flex shrink-0 flex-col overflow-hidden bg-sidebar text-slate-300 transition-[width] duration-200",
        collapsed ? "w-[4.5rem]" : "w-60",
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -bottom-28 -right-16 h-64 w-64 rounded-full bg-slate-700/40 blur-3xl" />
        <div className="absolute inset-y-0 left-0 w-1 bg-brand" />
      </div>
      <div className={cn("relative flex items-center py-5", collapsed ? "flex-col gap-3 px-2" : "gap-3 px-4")}>
        <Link href="/" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-xs font-bold text-white" title="CAU Ativos">
          CAU
        </Link>
        {collapsed ? null : (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">CAU Ativos</p>
            <p className="truncate text-xs text-slate-400">Inventário de TI</p>
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      <nav className={cn("relative flex-1 overflow-y-auto pb-4", collapsed ? "px-2" : "px-3")}>
        {groups.map((group) => (
          <div key={group.label} className={collapsed ? "mb-2" : "mb-5"}>
            {collapsed ? (
              <p className="sr-only">{group.label}</p>
            ) : (
              <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center rounded-xl text-sm transition",
                        collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-2.5 py-2",
                        active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon size={collapsed ? 18 : 16} />
                      {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className={cn("relative border-t border-white/10 py-4", collapsed ? "flex flex-col items-center gap-2 px-2" : "flex items-center gap-2 px-4")}>
        {collapsed ? (
          <div className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white" title={userName ?? "Usuário"}>
            {initial}
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{userName}</p>
            <p className="text-xs text-slate-500">{userRole === "ADMIN" ? "Administrador" : "Usuário"}</p>
          </div>
        )}
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
