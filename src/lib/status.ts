import type { AssetStatus } from "@prisma/client";

export const ASSET_STATUS: Record<
  AssetStatus,
  { label: string; className: string }
> = {
  IN_USE: { label: "Em uso", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/15" },
  AVAILABLE: { label: "Disponível", className: "bg-sky-50 text-sky-700 ring-sky-600/15" },
  RESERVE: { label: "Reserva", className: "bg-slate-100 text-slate-700 ring-slate-500/15" },
  MAINTENANCE: { label: "Manutenção", className: "bg-amber-50 text-amber-800 ring-amber-600/15" },
  AWAITING_INSTALL: { label: "Aguardando instalação", className: "bg-violet-50 text-violet-700 ring-violet-600/15" },
  DISPOSED: { label: "Baixado", className: "bg-rose-50 text-rose-700 ring-rose-600/15" },
  INACTIVE: { label: "Inativo", className: "bg-zinc-100 text-zinc-600 ring-zinc-500/15" },
};

export const STATUS_ORDER: AssetStatus[] = [
  "IN_USE",
  "AVAILABLE",
  "RESERVE",
  "MAINTENANCE",
  "AWAITING_INSTALL",
  "DISPOSED",
  "INACTIVE",
];

export function statusLabel(status: AssetStatus) {
  return ASSET_STATUS[status].label;
}

export const STATUS_OPTIONS = STATUS_ORDER.map((status) => ({
  id: status,
  label: statusLabel(status),
}));
