"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, CornerDownLeft, Monitor, PcCase, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Result = {
  id: string;
  type: "Computador" | "Monitor";
  title: string;
  subtitle: string;
  href: string;
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/busca?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = (await res.json()) as Result[];
        setResults(data);
        setActive(0);
      }
      setLoading(false);
    }, 160);
    return () => clearTimeout(handle);
  }, [query, open]);

  function close() {
    setOpen(false);
    setQuery("");
    setActive(0);
  }

  function go(href: string) {
    close();
    router.push(href);
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active];
      if (item) go(item.href);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full max-w-xl items-center gap-3 rounded-xl border border-line bg-white/80 px-3.5 py-2 text-sm text-slate-500 shadow-sm ring-0 transition hover:border-slate-300 hover:bg-white hover:shadow"
      >
        <Search size={16} className="text-slate-400" />
        <span className="flex-1 text-left">Buscar patrimônio, serial ou usuário…</span>
        <kbd className="hidden rounded-md border border-line bg-slate-50 px-1.5 py-0.5 font-sans text-[10px] font-medium tracking-wide text-slate-400 sm:inline">
          Ctrl K
        </kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Fechar busca"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            onClick={close}
          />
          <div className="relative mx-auto mt-[12vh] w-[min(40rem,calc(100%-1.5rem))] rounded-2xl border border-line bg-white shadow-[0_24px_80px_-20px_rgba(15,23,42,0.45)]">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={18} className="shrink-0 text-brand" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Patrimônio, serial ou usuário…"
                className="w-full border-0 bg-transparent py-4 text-[15px] text-ink outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
              />
              <kbd className="rounded-md border border-line bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                Esc
              </kbd>
            </div>

            <div className="max-h-[22rem] overflow-y-auto scrollbar-thin">
              {loading && !results.length ? (
                <p className="px-4 py-10 text-center text-sm text-slate-400">Buscando…</p>
              ) : results.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-slate-50 text-slate-400">
                    <Search size={18} />
                  </div>
                  <p className="text-sm font-medium text-slate-800">Nenhum resultado</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {query.trim()
                      ? "Tente outro patrimônio, serial ou nome."
                      : "Cadastre um computador ou monitor para começar."}
                  </p>
                </div>
              ) : (
                <ul className="p-2">
                  {results.map((item, index) => {
                    const Icon = item.type === "Computador" ? PcCase : Monitor;
                    const selected = index === active;
                    return (
                      <li key={`${item.type}-${item.id}`}>
                        <button
                          type="button"
                          onMouseEnter={() => setActive(index)}
                          onClick={() => go(item.href)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                            selected ? "bg-brand/10 text-slate-900" : "text-slate-700 hover:bg-slate-50",
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                              item.type === "Computador" ? "bg-sky-50 text-sky-700" : "bg-violet-50 text-violet-700",
                            )}
                          >
                            <Icon size={16} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">{item.title}</span>
                            <span className="mt-0.5 block truncate text-xs text-slate-500">
                              {item.type}
                              {item.subtitle ? ` · ${item.subtitle}` : ""}
                            </span>
                          </span>
                          {selected ? <CornerDownLeft size={14} className="shrink-0 text-slate-400" /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-line bg-slate-50/80 px-4 py-2.5 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-line bg-white px-1 py-0.5 text-slate-500"><ArrowUp size={10} /></kbd>
                <kbd className="rounded border border-line bg-white px-1 py-0.5 text-slate-500"><ArrowDown size={10} /></kbd>
                navegar
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-line bg-white px-1 py-0.5 text-slate-500"><CornerDownLeft size={10} /></kbd>
                abrir
              </span>
              <span className="ml-auto">Ctrl K para abrir</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
