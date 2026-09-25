import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AttentionList } from "@/components/AttentionList";
import { DistributionCard, StatusSplitCard } from "@/components/DistributionCard";
import { GarantiasDashboardCard, ModernizacaoDashboardCard } from "@/components/LifecycleDashboard";
import { MovementTimeline } from "@/components/MovementTimeline";
import { statusLabel, STATUS_ORDER } from "@/lib/status";
import { PageHeader } from "@/components/PageHeader";
import { formatPredio } from "@/lib/predios";
import { setorLabel } from "@/lib/alocacao";
import { computeWarranty } from "@/lib/garantia";
import { desktopWhere, notebookWhere } from "@/lib/inventory-kind";
import { buildModernizationIndexes } from "@/lib/modernizacao";
import type { AssetStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function countStatus(rows: { status: AssetStatus; _count: { _all: number } }[], status: AssetStatus) {
  return rows.find((row) => row.status === status)?._count._all ?? 0;
}

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function emptyWarrantyCounts() {
  return { vigente: 0, vence90: 0, vencida: 0, incompleto: 0 };
}

export default async function DashboardPage() {
  const where = { deletedAt: null } as const;
  const desktop = { ...where, ...desktopWhere() };
  const notebook = { ...where, ...notebookWhere() };

  const [
    computerStatus,
    notebookStatus,
    monitorStatus,
    byDeptPc,
    byLocationPc,
    recent,
    departments,
    locations,
    pcsSemSetor,
    pcsSemPredio,
    pcsSemUsuario,
    computersForGroups,
    monitorsForDist,
    computersLifecycle,
    notebooksLifecycle,
    monitorsLifecycle,
  ] = await Promise.all([
    prisma.computador.groupBy({ by: ["status"], where: desktop, _count: { _all: true } }),
    prisma.computador.groupBy({ by: ["status"], where: notebook, _count: { _all: true } }),
    prisma.monitor.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.computador.groupBy({ by: ["departamentoId"], where: desktop, _count: { _all: true } }),
    prisma.computador.groupBy({ by: ["localizacaoId"], where: desktop, _count: { _all: true } }),
    prisma.movimentacao.findMany({
      orderBy: { createdDate: "desc" },
      include: { actor: true, computador: true, monitor: true },
    }),
    prisma.departamento.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.localizacao.findMany(),
    prisma.computador.count({ where: { ...desktop, departamentoId: null } }),
    prisma.computador.count({ where: { ...desktop, localizacaoId: null } }),
    prisma.computador.count({
      where: {
        ...desktop,
        servidorId: null,
        OR: [{ usuario: null }, { usuario: "" }],
      },
    }),
    prisma.computador.findMany({ where: desktop, select: { groupId: true } }),
    prisma.monitor.findMany({
      where,
      select: { groupId: true, departamentoId: true, localizacaoId: true },
    }),
    prisma.computador.findMany({
      where: desktop,
      select: { dataRecebimento: true, prazoGarantiaAnos: true },
    }),
    prisma.computador.findMany({
      where: notebook,
      select: { dataRecebimento: true, prazoGarantiaAnos: true },
    }),
    prisma.monitor.findMany({
      where,
      select: { dataRecebimento: true, prazoGarantiaAnos: true },
    }),
  ]);

  const pcWarranty = emptyWarrantyCounts();
  const nbWarranty = emptyWarrantyCounts();
  const monWarranty = emptyWarrantyCounts();
  for (const item of computersLifecycle) {
    const w = computeWarranty({
      dataRecebimento: item.dataRecebimento,
      prazoGarantiaAnos: item.prazoGarantiaAnos,
    });
    if (w.situation === "vigente") pcWarranty.vigente += 1;
    else if (w.situation === "vence_90") pcWarranty.vence90 += 1;
    else if (w.situation === "vencida") pcWarranty.vencida += 1;
    else pcWarranty.incompleto += 1;
  }
  for (const item of notebooksLifecycle) {
    const w = computeWarranty({
      dataRecebimento: item.dataRecebimento,
      prazoGarantiaAnos: item.prazoGarantiaAnos,
    });
    if (w.situation === "vigente") nbWarranty.vigente += 1;
    else if (w.situation === "vence_90") nbWarranty.vence90 += 1;
    else if (w.situation === "vencida") nbWarranty.vencida += 1;
    else nbWarranty.incompleto += 1;
  }
  for (const item of monitorsLifecycle) {
    const w = computeWarranty({
      dataRecebimento: item.dataRecebimento,
      prazoGarantiaAnos: item.prazoGarantiaAnos,
    });
    if (w.situation === "vigente") monWarranty.vigente += 1;
    else if (w.situation === "vence_90") monWarranty.vence90 += 1;
    else if (w.situation === "vencida") monWarranty.vencida += 1;
    else monWarranty.incompleto += 1;
  }

  const modernizationIndexes = buildModernizationIndexes([
    ...computersLifecycle.map((item) => ({ kind: "COMPUTER" as const, dataRecebimento: item.dataRecebimento })),
    ...notebooksLifecycle.map((item) => ({ kind: "NOTEBOOK" as const, dataRecebimento: item.dataRecebimento })),
    ...monitorsLifecycle.map((item) => ({ kind: "MONITOR" as const, dataRecebimento: item.dataRecebimento })),
  ]);

  const pcGroupIds = new Set(computersForGroups.map((item) => item.groupId).filter((id): id is string => Boolean(id)));
  const monGroupIds = new Set(monitorsForDist.map((item) => item.groupId).filter((id): id is string => Boolean(id)));
  const pcsSemMonitor = computersForGroups.filter((item) => !item.groupId || !monGroupIds.has(item.groupId)).length;
  const monitoresSemAlocacao = monitorsForDist.filter(
    (item) => (!item.groupId || !pcGroupIds.has(item.groupId)) && !item.departamentoId,
  ).length;

  const computerTotal = computerStatus.reduce((sum, row) => sum + row._count._all, 0);
  const notebookTotal = notebookStatus.reduce((sum, row) => sum + row._count._all, 0);
  const monitorTotal = monitorStatus.reduce((sum, row) => sum + row._count._all, 0);
  const pcInUse = countStatus(computerStatus, "IN_USE");
  const pcReserve = countStatus(computerStatus, "RESERVE");
  const maintenance =
    countStatus(computerStatus, "MAINTENANCE") +
    countStatus(notebookStatus, "MAINTENANCE") +
    countStatus(monitorStatus, "MAINTENANCE");
  const awaiting =
    countStatus(computerStatus, "AWAITING_INSTALL") +
    countStatus(notebookStatus, "AWAITING_INSTALL") +
    countStatus(monitorStatus, "AWAITING_INSTALL");

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, setorLabel(d) || d.nome]));
  const locMap = Object.fromEntries(locations.map((d) => [d.id, formatPredio(d)]));

  const monitorByDept = new Map<string, number>();
  const monitorByLoc = new Map<string, number>();
  for (const monitor of monitorsForDist) {
    const deptId = monitor.departamentoId;
    const locId = monitor.localizacaoId;
    bump(monitorByDept, deptId ?? "");
    bump(monitorByLoc, locId ?? "");
  }

  const pcByDept = byDeptPc.map((row) => ({
    label: row.departamentoId ? deptMap[row.departamentoId] || "Não informado" : "Não informado",
    value: row._count._all,
  }));

  const monByDept = [...monitorByDept.entries()].map(([id, value]) => ({
    label: id ? deptMap[id] || "Não informado" : "Não informado",
    value,
  }));

  const pcByLoc = byLocationPc.map((row) => ({
    label: locMap[row.localizacaoId ?? ""] || "Não informado",
    value: row._count._all,
  }));

  const monByLoc = [...monitorByLoc.entries()].map(([id, value]) => ({
    label: id ? locMap[id] || "Não informado" : "Não informado",
    value,
  }));

  const statusSplit = STATUS_ORDER.map((status) => ({
    label: statusLabel(status),
    computers: countStatus(computerStatus, status),
    notebooks: countStatus(notebookStatus, status),
    monitors: countStatus(monitorStatus, status),
  }));

  const kpis = [
    { href: "/computadores", label: "Computadores", value: computerTotal, hint: null as string | null },
    { href: "/notebooks", label: "Notebooks", value: notebookTotal, hint: null },
    { href: "/monitores", label: "Monitores", value: monitorTotal, hint: null },
    { href: "/computadores?status=IN_USE", label: "Em uso (PC)", value: pcInUse, hint: null },
    { href: "/computadores?status=RESERVE", label: "Reserva (PC)", value: pcReserve, hint: null },
    {
      href: "/relatorios?tipo=manutencao",
      label: "Manutenção",
      value: maintenance,
      hint: `${countStatus(computerStatus, "MAINTENANCE")} PC · ${countStatus(notebookStatus, "MAINTENANCE")} nb · ${countStatus(monitorStatus, "MAINTENANCE")} mon.`,
    },
    {
      href: "/relatorios?tipo=aguardando",
      label: "Aguardando instalação",
      value: awaiting,
      hint: `${countStatus(computerStatus, "AWAITING_INSTALL")} PC · ${countStatus(notebookStatus, "AWAITING_INSTALL")} nb · ${countStatus(monitorStatus, "AWAITING_INSTALL")} mon.`,
    },
  ];

  const pendencias = [
    { label: "PCs sem setor", value: pcsSemSetor, href: "/relatorios?tipo=sem-setor" },
    { label: "PCs sem prédio", value: pcsSemPredio, href: "/relatorios?tipo=sem-predio" },
    { label: "PCs sem usuário", value: pcsSemUsuario, href: "/relatorios?tipo=sem-usuario" },
    { label: "PCs sem monitor", value: pcsSemMonitor, href: "/relatorios?tipo=sem-monitor" },
    {
      label: "Monitores sem PC e sem setor",
      value: monitoresSemAlocacao,
      href: "/relatorios?tipo=monitor-sem-alocacao",
    },
    {
      label: "Em reserva",
      value: countStatus(computerStatus, "RESERVE") + countStatus(notebookStatus, "RESERVE") + countStatus(monitorStatus, "RESERVE"),
      href: "/relatorios?tipo=reserva",
    },
    { label: "Em manutenção", value: maintenance, href: "/relatorios?tipo=manutencao" },
    { label: "Aguardando instalação", value: awaiting, href: "/relatorios?tipo=aguardando" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão operacional do parque: totais, pendências de alocação e distribuição por setor e prédio."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-7">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="surface px-4 py-4 transition hover:border-slate-300 hover:shadow-sm"
          >
            <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{kpi.value}</p>
            {kpi.hint ? <p className="mt-1 text-[11px] text-slate-400">{kpi.hint}</p> : null}
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <GarantiasDashboardCard
          vigente={
            pcWarranty.vigente +
            pcWarranty.vence90 +
            nbWarranty.vigente +
            nbWarranty.vence90 +
            monWarranty.vigente +
            monWarranty.vence90
          }
          vence90={pcWarranty.vence90 + nbWarranty.vence90 + monWarranty.vence90}
          vencida={pcWarranty.vencida + nbWarranty.vencida + monWarranty.vencida}
          incompleto={pcWarranty.incompleto + nbWarranty.incompleto + monWarranty.incompleto}
          pc={pcWarranty}
          nb={nbWarranty}
          mon={monWarranty}
        />
        <ModernizacaoDashboardCard indexes={modernizationIndexes} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <AttentionList items={pendencias} />
        <StatusSplitCard title="Status (PC × Notebook × Monitor)" statuses={statusSplit} />
        <DistributionCard title="Computadores por setor" items={pcByDept} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <DistributionCard title="Monitores por setor" items={monByDept} />
        <DistributionCard title="Computadores por prédio" items={pcByLoc} />
        <DistributionCard title="Monitores por prédio" items={monByLoc} />
      </div>

      <section className="surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Atividade recente</h2>
          <Link href="/movimentacoes" className="text-xs font-medium text-brand hover:underline">
            Ver todas
          </Link>
        </div>
        <MovementTimeline items={recent} showAsset />
      </section>
    </>
  );
}
