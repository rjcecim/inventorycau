"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { inputClass } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

export type SearchSelectOption = { id: string; label: string };

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function SearchSelect({
  name,
  options,
  defaultValue = "",
  value: valueProp,
  onChange,
  emptyLabel = "Não informado",
  placeholder = "Pesquisar…",
  allowEmpty = true,
  required = false,
  emptyMessage = "Nenhum resultado",
  className,
}: {
  name?: string;
  options: SearchSelectOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  emptyLabel?: string;
  placeholder?: string;
  allowEmpty?: boolean;
  required?: boolean;
  emptyMessage?: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isControlled = valueProp !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const value = isControlled ? valueProp : internal;
  const selected = options.find((item) => item.id === value);
  const selectedLabel = selected?.label ?? (allowEmpty || !value ? emptyLabel : "");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selectedLabel);
  const [active, setActive] = useState(0);

  function setValue(next: string) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  const rows = useMemo(
    () => (allowEmpty ? [{ id: "", label: emptyLabel }, ...options] : options),
    [allowEmpty, emptyLabel, options],
  );

  const filtered = useMemo(() => {
    const term = fold(query.trim());
    if (!term || query === selectedLabel) return rows;
    return rows.filter((item) => fold(item.label).includes(term));
  }, [query, rows, selectedLabel]);

  useEffect(() => {
    if (open) return;
    setQuery(selectedLabel);
  }, [open, selectedLabel]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        if (allowEmpty && !query.trim()) {
          setValue("");
          setQuery(emptyLabel);
        } else {
          setQuery(selectedLabel);
        }
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  });

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  function choose(option: SearchSelectOption) {
    setValue(option.id);
    setQuery(option.label);
    setOpen(false);
  }

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      {name ? <input type="hidden" name={name} value={value} required={required} /> : null}
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          className={cn(inputClass, "pr-8")}
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={(event) => {
            setOpen(true);
            event.target.select();
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActive((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              const option = filtered[active] ?? filtered[0];
              if (option) choose(option);
            } else if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              setQuery(selectedLabel);
            }
          }}
        />
        <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
      {open ? (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-white py-1 shadow-lg"
        >
          {filtered.length ? (
            filtered.map((item, index) => (
              <li key={item.id || "__empty__"} role="option" aria-selected={item.id === value}>
                <button
                  type="button"
                  className={cn(
                    "w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50",
                    index === active ? "bg-slate-50" : "",
                    item.id === value ? "font-medium text-brand" : "text-slate-700",
                    !item.id ? "text-slate-400" : "",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(item)}
                >
                  {item.label}
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-slate-400">{emptyMessage}</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
