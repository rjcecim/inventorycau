import Link from "next/link";
import type { CategoryIndex } from "@/lib/modernizacao";

export function GarantiasDashboardCard({
  vigente,
  vence90,
  vencida,
  incompleto,
  pc,
  nb,
  mon,
}: {
  vigente: number;
  vence90: number;
  vencida: number;
  incompleto: number;
  pc: { vigente: number; vence90: number; vencida: number; incompleto: number };
  nb?: { vigente: number; vence90: number; vencida: number; incompleto: number };
  mon: { vigente: number; vence90: number; vencida: number; incompleto: number };
}) {
  const notebooks = nb ?? { vigente: 0, vence90: 0, vencida: 0, incompleto: 0 };
  return (
    <section className="surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Garantias</h2>
          <p className="mt-0.5 text-xs text-slate-500">Baseada na data de recebimento + prazo em anos</p>
        </div>
        <Link href="/relatorios/garantias" className="text-xs font-medium text-brand hover:underline">
          Abrir relatório
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashStat
          href="/relatorios/garantias?situacao=vigente"
          label="Vigentes"
          value={vigente}
          hint={`${pc.vigente + pc.vence90} PC · ${notebooks.vigente + notebooks.vence90} nb · ${mon.vigente + mon.vence90} mon.`}
          tone="ok"
        />
        <DashStat
          href="/relatorios/garantias?situacao=vence_90"
          label="Vence em até 90 dias"
          value={vence90}
          hint="Parte das vigentes"
          tone="warn"
        />
        <DashStat
          href="/relatorios/garantias?situacao=vencida"
          label="Vencidas"
          value={vencida}
          hint={`${pc.vencida} PC · ${notebooks.vencida} nb · ${mon.vencida} mon.`}
          tone="bad"
        />
        <DashStat
          href="/relatorios/garantias?situacao=incompleto"
          label="Dados incompletos"
          value={incompleto}
          hint={`${pc.incompleto} PC · ${notebooks.incompleto} nb · ${mon.incompleto} mon.`}
        />
      </div>
    </section>
  );
}

export function ModernizacaoDashboardCard({ indexes }: { indexes: CategoryIndex[] }) {
  return (
    <section className="surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Modernização</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Índices por categoria (PC e notebook 6 anos · monitores 8 anos). Sem índice geral oficial.
          </p>
        </div>
        <Link href="/relatorios/modernizacao" className="text-xs font-medium text-brand hover:underline">
          Abrir relatório
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {indexes.map((item) => (
          <Link
            key={item.kind}
            href={`/relatorios/modernizacao?tipo=${item.kind}`}
            className="rounded-xl border border-line bg-slate-50 px-4 py-3 transition hover:border-slate-300 hover:bg-white"
          >
            <p className="text-xs font-medium text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              {item.applicable && item.index != null ? `${item.index.toFixed(1)}%` : "N/A"}
            </p>
            {item.provisional ? (
              <p className="mt-1 text-[11px] font-medium text-amber-700">Provisório — faltam datas</p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-400">{item.summary}</p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              {item.within} no prazo · {item.outside} excedido · {item.missing} sem data · total {item.total}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DashStat({
  href,
  label,
  value,
  hint,
  tone,
}: {
  href: string;
  label: string;
  value: number;
  hint?: string;
  tone?: "ok" | "warn" | "bad";
}) {
  const valueClass =
    tone === "ok"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : tone === "bad"
          ? "text-rose-700"
          : "text-slate-900";
  return (
    <Link href={href} className="rounded-xl border border-line px-3 py-3 transition hover:border-slate-300 hover:bg-slate-50">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
    </Link>
  );
}
