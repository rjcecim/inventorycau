import { cn } from "@/lib/utils";

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label = "Modo de cadastro",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string }[];
  label?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-line">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition",
              active ? "bg-white font-semibold text-slate-900 shadow-sm" : "font-medium text-slate-600 hover:text-slate-800",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
