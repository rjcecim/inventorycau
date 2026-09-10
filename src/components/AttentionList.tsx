import Link from "next/link";

export type AttentionItem = {
  label: string;
  value: number;
  href: string;
};

export function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <section className="surface p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Pendências</h2>
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="flex items-center justify-between gap-3 py-2.5 text-sm transition hover:bg-slate-50"
            >
              <span className="text-slate-700">{item.label}</span>
              <span
                className={
                  item.value > 0
                    ? "rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-amber-800 ring-1 ring-amber-600/15"
                    : "rounded-md bg-slate-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-400"
                }
              >
                {item.value}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
