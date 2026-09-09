"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/busca?q=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
    }, 180);
    return () => clearTimeout(handle);
  }, [query, open]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full max-w-md items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-500 shadow-sm"
      >
        <Search size={16} />
        <span className="flex-1 text-left">Buscar patrimônio, serial, usuário…</span>
        <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline">Ctrl K</kbd>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-slate-900/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="mx-auto mt-16 max-w-lg overflow-hidden rounded-xl border border-line bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-line px-3">
              <Search size={16} className="text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Patrimônio, serial, usuário…"
                className="w-full border-0 py-3 text-sm outline-none"
              />
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-slate-500">Nenhum resultado</li>
              ) : (
                results.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <button
                      type="button"
                      onClick={() => go(item.href)}
                      className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <span className="mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                        {item.type}
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-slate-900">{item.title}</span>
                        <span className="block text-xs text-slate-500">{item.subtitle}</span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
