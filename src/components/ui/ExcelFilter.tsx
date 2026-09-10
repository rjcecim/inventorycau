"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDownAZ, ArrowUpAZ, ChevronDown, Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const PANEL_WIDTH = 288;

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function ExcelFilter({
  label,
  options,
  selected,
  onApply,
  onSort,
  active,
  align = "left",
  title,
}: {
  label: string;
  options: string[];
  selected: string[];
  onApply: (next: string[]) => void;
  onSort: (dir: "asc" | "desc") => void;
  active: boolean;
  align?: "left" | "right";
  title?: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<string[]>(selected);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  function place() {
    const button = buttonRef.current;
    const panel = panelRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const margin = 8;
    let left = align === "right" ? rect.right - PANEL_WIDTH : rect.left;
    left = Math.min(Math.max(margin, left), window.innerWidth - PANEL_WIDTH - margin);

    const height = panel?.offsetHeight ?? 360;
    const below = rect.bottom + 4;
    const above = rect.top - 4 - height;
    const top = below + height > window.innerHeight - margin && above > margin ? above : below;

    setCoords({ top, left });
  }

  function openPanel() {
    setDraft(selected);
    setQuery("");
    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: align === "right" ? rect.right - PANEL_WIDTH : rect.left,
      });
    }
    setOpen(true);
  }

  useLayoutEffect(() => {
    if (!open) return;
    place();
  }, [open, align, query]);

  useEffect(() => {
    if (!open) return;
    function onMove() {
      place();
    }
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, align]);

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const visible = useMemo(() => {
    const term = fold(query.trim());
    if (!term) return options;
    return options.filter((item) => fold(item).includes(term));
  }, [options, query]);

  const allVisibleSelected = visible.length > 0 && visible.every((item) => draft.includes(item));

  function toggleAll() {
    if (allVisibleSelected) {
      setDraft(draft.filter((item) => !visible.includes(item)));
    } else {
      setDraft([...new Set([...draft, ...visible])]);
    }
  }

  function toggle(value: string) {
    setDraft((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  const panel = open ? (
    <div
      ref={panelRef}
      style={{ top: coords.top, left: coords.left, width: PANEL_WIDTH }}
      className="fixed z-[80] overflow-hidden rounded-xl border border-line bg-white shadow-[0_16px_40px_-16px_rgba(15,23,42,0.28)]"
    >
      <div className="border-b border-line p-2">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
          onClick={() => { onSort("asc"); setOpen(false); }}
        >
          <ArrowDownAZ size={15} className="text-slate-400" />
          Classificar de A a Z
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
          onClick={() => { onSort("desc"); setOpen(false); }}
        >
          <ArrowUpAZ size={15} className="text-slate-400" />
          Classificar de Z a A
        </button>
      </div>
      <div className="border-b border-line p-2">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar"
            className="w-full rounded-lg border border-line bg-white py-1.5 pl-8 pr-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </div>
      </div>
      <div className="max-h-56 overflow-y-auto p-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleAll}
            className="size-3.5 rounded border-line text-brand"
          />
          (Selecionar tudo)
        </label>
        {visible.map((item) => (
          <label
            key={item}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={draft.includes(item)}
              onChange={() => toggle(item)}
              className="size-3.5 rounded border-line text-brand"
            />
            <span className="truncate">{item}</span>
          </label>
        ))}
        {!visible.length ? <p className="px-2 py-3 text-sm text-slate-400">Nenhum item</p> : null}
      </div>
      <div className="flex justify-end gap-2 border-t border-line bg-slate-50 px-2 py-2">
        <button
          type="button"
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover"
          onClick={() => { onApply(draft); setOpen(false); }}
        >
          OK
        </button>
        <button
          type="button"
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-line hover:bg-slate-50"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        title={title ?? label}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1 py-0.5 text-left text-[11px] font-semibold transition hover:bg-slate-200/70",
          active ? "text-brand" : "text-slate-500",
        )}
      >
        {label}
        {active ? (
          <Filter size={11} className="text-brand" />
        ) : (
          <ChevronDown size={12} className="text-slate-400" />
        )}
      </button>
      {typeof document !== "undefined" && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
