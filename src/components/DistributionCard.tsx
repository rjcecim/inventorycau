function BarList({
  items,
  total,
}: {
  items: { label: string; value: number }[];
  total: number;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  if (!items.length) return <p className="text-sm text-slate-500">Sem dados suficientes.</p>;
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <li key={item.label}>
            <div className="mb-1 flex justify-between gap-2 text-sm">
              <span className="truncate text-slate-700" title={item.label}>{item.label}</span>
              <span className="shrink-0 font-medium tabular-nums text-slate-900">
                {item.value}
                <span className="ml-1.5 text-xs font-normal text-slate-400">{pct}%</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function summarizeDistribution(
  items: { label: string; value: number }[],
  limit = 8,
) {
  const sorted = [...items].filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, item) => sum + item.value, 0);
  const top = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  const others = rest.reduce((sum, item) => sum + item.value, 0);
  if (others > 0) {
    top.push({ label: `Outros (${rest.length})`, value: others });
  }
  return { items: top, total };
}

export function DistributionCard({
  title,
  items,
  limit = 8,
}: {
  title: string;
  items: { label: string; value: number }[];
  limit?: number;
}) {
  const { items: visible, total } = summarizeDistribution(items, limit);
  return (
    <section className="surface p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
      <BarList items={visible} total={total} />
    </section>
  );
}

export function StatusSplitCard({
  title,
  statuses,
}: {
  title: string;
  statuses: { label: string; computers: number; notebooks?: number; monitors: number }[];
}) {
  const rows = statuses.filter((row) => row.computers > 0 || (row.notebooks ?? 0) > 0 || row.monitors > 0);
  if (!rows.length) {
    return (
      <section className="surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">Sem dados suficientes.</p>
      </section>
    );
  }

  return (
    <section className="surface p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
      <div className="mb-2 grid grid-cols-[1fr_3.5rem_3.5rem_3.5rem] gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <span>Status</span>
        <span className="text-right">PC</span>
        <span className="text-right">Nb.</span>
        <span className="text-right">Mon.</span>
      </div>
      <ul className="divide-y divide-line">
        {rows.map((row) => (
          <li key={row.label} className="grid grid-cols-[1fr_3.5rem_3.5rem_3.5rem] gap-2 py-2 text-sm">
            <span className="truncate text-slate-700">{row.label}</span>
            <span className="text-right tabular-nums font-medium text-slate-900">{row.computers}</span>
            <span className="text-right tabular-nums font-medium text-slate-900">{row.notebooks ?? 0}</span>
            <span className="text-right tabular-nums font-medium text-slate-900">{row.monitors}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
