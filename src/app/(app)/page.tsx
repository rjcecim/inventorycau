import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DistributionCard } from "@/components/DistributionCard";
import { MovementTimeline } from "@/components/MovementTimeline";
import { statusLabel } from "@/lib/status";
import { PageHeader } from "@/components/PageHeader";
import { formatPredio } from "@/lib/predios";
import type { AssetStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function groupCount(rows: { key: string | null; _count: { _all: number } }[]) {
  return rows
    .map((row) => ({ label: row.key || "Não informado", value: row._count._all }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export default async function DashboardPage() {
  const where = { deletedAt: null };
  const [
    computerStatus,
    monitorStatus,
    byDept,
    byMaker,
    byLocation,
    recent,
  ] = await Promise.all([
    prisma.computador.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.monitor.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.computador.groupBy({ by: ["departamentoId"], where, _count: { _all: true } }),
    prisma.computador.groupBy({ by: ["fabricante"], where, _count: { _all: true } }),
    prisma.computador.groupBy({ by: ["localizacaoId"], where, _count: { _all: true } }),
    prisma.movimentacao.findMany({
      take: 8,
      orderBy: { createdDate: "desc" },
      include: { actor: true, computador: true, monitor: true },
    }),
  ]);

  const computerTotal = computerStatus.reduce((sum, row) => sum + row._count._all, 0);
  const monitorTotal = monitorStatus.reduce((sum, row) => sum + row._count._all, 0);
  const countStatus = (rows: typeof computerStatus, status: AssetStatus) =>
    rows.find((row) => row.status === status)?._count._all ?? 0;

  const inUse = countStatus(computerStatus, "IN_USE") + countStatus(monitorStatus, "IN_USE");
  const available = countStatus(computerStatus, "AVAILABLE") + countStatus(monitorStatus, "AVAILABLE");
  const maintenance = countStatus(computerStatus, "MAINTENANCE") + countStatus(monitorStatus, "MAINTENANCE");
  const disposed = countStatus(computerStatus, "DISPOSED") + countStatus(monitorStatus, "DISPOSED");

  const departments = await prisma.departamento.findMany({ orderBy: { sortOrder: "asc" } });
  const locations = await prisma.localizacao.findMany();
  const locMap = Object.fromEntries(locations.map((d) => [d.id, formatPredio(d)]));

  const statusItems = Array.from(
    new Set([...computerStatus.map((row) => row.status), ...monitorStatus.map((row) => row.status)]),
  ).map((status) => ({
    label: statusLabel(status),
    value: countStatus(computerStatus, status) + countStatus(monitorStatus, status),
  }));

  const kpis = [
    { href: "/computadores", label: "Computadores", value: computerTotal },
    { href: "/monitores", label: "Monitores", value: monitorTotal },
    { href: "/computadores?status=IN_USE", label: "Em uso", value: inUse },
    { href: "/computadores?status=AVAILABLE", label: "Disponíveis", value: available },
    { href: "/relatorios?tipo=manutencao", label: "Manutenção", value: maintenance },
    { href: "/relatorios?tipo=baixados", label: "Baixados", value: disposed },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Parque de computadores e monitores do CAU em um único painel." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="rounded-xl border border-line bg-white px-4 py-4 transition hover:border-slate-300"
          >
            <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{kpi.value}</p>
          </Link>
        ))}
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <DistributionCard
          title="Computadores por setor"
          items={byDept.map((row) => ({
            label: row.departamentoId
              ? (() => {
                  const d = departments.find((item) => item.id === row.departamentoId);
                  return d ? `${d.codigo}. ${d.nome}` : "Não informado";
                })()
              : "Não informado",
            value: row._count._all,
          })).sort((a, b) => b.value - a.value)}
        />
        <DistributionCard title="Computadores por fabricante" items={groupCount(byMaker.map((row) => ({ key: row.fabricante, _count: row._count })))} />
        <DistributionCard
          title="Ativos por status"
          items={statusItems.sort((a, b) => b.value - a.value)}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionCard
          title="Computadores por prédio"
          items={byLocation.map((row) => ({ label: locMap[row.localizacaoId ?? ""] || "Não informado", value: row._count._all })).sort((a, b) => b.value - a.value)}
        />
        <section className="rounded-xl border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Atividade recente</h2>
            <Link href="/movimentacoes" className="text-xs font-medium text-brand hover:underline">Ver todas</Link>
          </div>
          <MovementTimeline items={recent} showAsset />
        </section>
      </div>
    </>
  );
}
