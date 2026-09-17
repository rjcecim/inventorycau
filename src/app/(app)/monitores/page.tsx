import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MonitorTable } from "@/components/MonitorTable";
import { PageHeader } from "@/components/PageHeader";
import { isAdminRole } from "@/lib/authz";
import type { AssetStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function MonitoresPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const status = params.status as AssetStatus | undefined;

  const monitors = await prisma.monitor.findMany({
    where: { deletedAt: null, ...(status ? { status } : {}) },
    orderBy: { tombo: "asc" },
    include: {
      departamento: true,
      localizacao: true,
    },
  });
  const groupIds = [...new Set(monitors.map((item) => item.groupId).filter((id): id is string => Boolean(id)))];
  const groupedPcs = groupIds.length
    ? await prisma.computador.findMany({
        where: { deletedAt: null, groupId: { in: groupIds } },
        include: { departamento: true, localizacao: true },
        orderBy: { tombo: "asc" },
      })
    : [];
  const pcByGroup = new Map<string, (typeof groupedPcs)[number]>();
  for (const pc of groupedPcs) {
    if (pc.groupId && !pcByGroup.has(pc.groupId)) pcByGroup.set(pc.groupId, pc);
  }
  const rows = monitors.map((item) => ({
    ...item,
    computador: item.groupId ? pcByGroup.get(item.groupId) ?? null : null,
  }));

  return (
    <>
      <PageHeader title="Monitores" description="Inventário de monitores. Use o filtro no cabeçalho de cada coluna, como no Excel." />
      <MonitorTable
        monitors={rows}
        isAdmin={isAdminRole(session?.user?.role)}
      />
    </>
  );
}
