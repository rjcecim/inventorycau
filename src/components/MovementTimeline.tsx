"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Laptop, Monitor, PcCase } from "lucide-react";
import { inventoryKindHref } from "@/lib/inventory-kind";
import { FIELD_LABELS } from "@/lib/audit";
import { cn, formatDateTime } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { ASSET_STATUS } from "@/lib/status";
import type { AssetStatus } from "@prisma/client";

type Movement = {
  id: string;
  campo: string;
  valorAnterior: string | null;
  valorNovo: string | null;
  createdDate: Date | string;
  actor: { fullName: string } | null;
  computador: { id: string; tombo: string } | null;
  monitor: { id: string; tombo: string } | null;
  kind: "COMPUTER" | "NOTEBOOK" | "MONITOR";
};

type ChangeGroup = {
  key: string;
  kind: "COMPUTER" | "NOTEBOOK" | "MONITOR";
  assetLabel: string;
  assetHref: string | null;
  actor: string | null;
  createdDate: Date | string;
  changes: Array<{ id: string; campo: string; from: string; to: string }>;
};

function displayValue(campo: string, value: string | null) {
  if (!value) return "—";
  if (campo === "status" && value in ASSET_STATUS) {
    return ASSET_STATUS[value as AssetStatus].label;
  }
  return value;
}

function fieldLabel(campo: string) {
  return FIELD_LABELS[campo] ?? campo;
}

function groupMovements(items: Movement[]): ChangeGroup[] {
  const groups = new Map<string, ChangeGroup>();

  for (const item of items) {
    const timeKey = new Date(item.createdDate).toISOString().slice(0, 19);
    const isComputerLike = item.kind === "COMPUTER" || item.kind === "NOTEBOOK";
    const assetId = isComputerLike ? item.computador?.id : item.monitor?.id;
    const tombo = isComputerLike ? item.computador?.tombo : item.monitor?.tombo;
    const key = `${item.kind}:${assetId ?? tombo ?? "x"}:${timeKey}:${item.actor?.fullName ?? ""}`;

    const existing = groups.get(key);
    const change = {
      id: item.id,
      campo: item.campo,
      from: displayValue(item.campo, item.valorAnterior),
      to: displayValue(item.campo, item.valorNovo),
    };

    if (existing) {
      existing.changes.push(change);
      continue;
    }

    groups.set(key, {
      key,
      kind: item.kind,
      assetLabel: tombo
        ? item.kind === "NOTEBOOK"
          ? `Notebook ${tombo}`
          : item.kind === "COMPUTER"
            ? `PC ${tombo}`
            : `Monitor ${tombo}`
        : item.campo === "lote"
          ? item.valorNovo ?? "Cadastro em lote"
          : item.kind === "NOTEBOOK"
            ? "Notebooks"
            : item.kind === "COMPUTER"
              ? "Computadores"
              : "Monitores",
      assetHref: assetId ? inventoryKindHref(item.kind, assetId) : null,
      actor: item.actor?.fullName ?? null,
      createdDate: item.createdDate,
      changes: [change],
    });
  }

  return [...groups.values()];
}

function ValueChip({ value }: { value: string }) {
  const empty = value === "—";
  return (
    <span
      className={
        empty
          ? "rounded-md bg-slate-50 px-2 py-0.5 text-slate-400 ring-1 ring-line"
          : "rounded-md bg-white px-2 py-0.5 text-slate-800 ring-1 ring-line"
      }
    >
      {value}
    </span>
  );
}

const PAGE_SIZE = 10;
const PAGE_WINDOW = 10;

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const [jump, setJump] = useState("");
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(page, 1), totalPages);
  const windowStart = Math.floor((current - 1) / PAGE_WINDOW) * PAGE_WINDOW + 1;
  const windowEnd = Math.min(windowStart + PAGE_WINDOW - 1, totalPages);
  const pages = Array.from({ length: windowEnd - windowStart + 1 }, (_, index) => windowStart + index);

  function goTo(next: number) {
    const clamped = Math.min(Math.max(next, 1), totalPages);
    onPageChange(clamped);
    setJump("");
  }

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        Página {current} de {totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          className="px-2 py-1.5"
          disabled={current <= 1}
          onClick={() => goTo(current - PAGE_WINDOW)}
          aria-label="Recuar 10 páginas"
          title="Recuar 10 páginas"
        >
          <ChevronsLeft size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="px-2 py-1.5"
          disabled={current <= 1}
          onClick={() => goTo(current - 1)}
          aria-label="Página anterior"
          title="Página anterior"
        >
          <ChevronLeft size={16} />
        </Button>
        <nav aria-label="Paginação" className="flex flex-wrap items-center gap-1 px-1 text-sm">
          {pages.map((number, index) => (
            <span key={number} className="flex items-center gap-1">
              {index > 0 ? <span className="text-slate-300">|</span> : null}
              <button
                type="button"
                onClick={() => goTo(number)}
                className={cn(
                  "min-w-7 rounded-md px-1.5 py-0.5 font-medium",
                  number === current ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100",
                )}
                aria-current={number === current ? "page" : undefined}
              >
                {number}
              </button>
            </span>
          ))}
        </nav>
        <Button
          type="button"
          variant="ghost"
          className="px-2 py-1.5"
          disabled={current >= totalPages}
          onClick={() => goTo(current + 1)}
          aria-label="Próxima página"
          title="Próxima página"
        >
          <ChevronRight size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="px-2 py-1.5"
          disabled={current >= totalPages}
          onClick={() => goTo(current + PAGE_WINDOW)}
          aria-label="Avançar 10 páginas"
          title="Avançar 10 páginas"
        >
          <ChevronsRight size={16} />
        </Button>
      </div>
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const next = Number.parseInt(jump, 10);
          if (Number.isFinite(next)) goTo(next);
        }}
      >
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          Ir para
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jump}
            onChange={(event) => setJump(event.target.value)}
            className={cn(inputClass, "w-16 px-2 py-1.5 text-center")}
            aria-label="Número da página"
          />
        </label>
        <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
          Ir
        </Button>
      </form>
    </div>
  );
}

export function MovementTimeline({ items, showAsset = false }: { items: Movement[]; showAsset?: boolean }) {
  const groups = useMemo(() => groupMovements(items), [items]);
  const [page, setPage] = useState(1);
  const pageSize = PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(groups.length / pageSize));
  const current = Math.min(page, totalPages);
  const visible = groups.slice((current - 1) * pageSize, current * pageSize);

  if (!items.length) {
    return (
      <EmptyState
        title="Nenhuma movimentação registrada"
        description="Alterações de status, alocação e vínculos aparecerão aqui."
      />
    );
  }

  return (
    <div>
      <ol className="space-y-3">
        {visible.map((group) => {
          const Icon = group.kind === "NOTEBOOK" ? Laptop : group.kind === "COMPUTER" ? PcCase : Monitor;
          return (
            <li key={group.key} className="rounded-xl border border-line bg-slate-50/60 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-slate-500 ring-1 ring-line">
                    <Icon size={15} />
                  </span>
                  {showAsset ? (
                    group.assetHref ? (
                      <Link href={group.assetHref} className="truncate text-sm font-semibold text-brand hover:underline">
                        {group.assetLabel}
                      </Link>
                    ) : (
                      <span className="truncate text-sm font-semibold text-slate-900">{group.assetLabel}</span>
                    )
                  ) : (
                    <span className="text-sm font-semibold text-slate-900">
                      {group.changes.length > 1 ? "Alterações registradas" : fieldLabel(group.changes[0].campo)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {formatDateTime(group.createdDate)}
                  {group.actor ? ` · ${group.actor}` : ""}
                </p>
              </div>

              <ul className="space-y-2">
                {group.changes.map((change) => (
                  <li
                    key={change.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-line"
                  >
                    <span className="w-36 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {fieldLabel(change.campo)}
                    </span>
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <ValueChip value={change.from} />
                      <ArrowRight size={14} className="shrink-0 text-slate-300" />
                      <ValueChip value={change.to} />
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
      <Pagination page={current} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
