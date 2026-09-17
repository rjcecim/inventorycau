import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ComputerTable } from "@/components/ComputerTable";
import { PageHeader } from "@/components/PageHeader";
import { isAdminRole } from "@/lib/authz";
import type { AssetStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ComputadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const status = params.status as AssetStatus | undefined;

  const computers = await prisma.computador.findMany({
    where: { deletedAt: null, ...(status ? { status } : {}) },
    orderBy: { tombo: "asc" },
    include: { departamento: true, localizacao: true },
  });
  const groupIds = [...new Set(computers.map((item) => item.groupId).filter((id): id is string => Boolean(id)))];
  const [pcGroups, monitorGroups] = groupIds.length
    ? await Promise.all([
        prisma.computador.groupBy({ by: ["groupId"], where: { deletedAt: null, groupId: { in: groupIds } }, _count: { _all: true } }),
        prisma.monitor.groupBy({ by: ["groupId"], where: { deletedAt: null, groupId: { in: groupIds } }, _count: { _all: true } }),
      ])
    : [[], []];
  const pcCount = new Map(pcGroups.map((item) => [item.groupId, item._count._all]));
  const monCount = new Map(monitorGroups.map((item) => [item.groupId, item._count._all]));
  const rows = computers.map((item) => ({
    ...item,
    agrupados: item.groupId ? (pcCount.get(item.groupId) ?? 0) + (monCount.get(item.groupId) ?? 0) - 1 : 0,
  }));

  return (
    <>
      <PageHeader title="Computadores" description="Inventário de computadores. Use o filtro no cabeçalho de cada coluna, como no Excel." />
      <ComputerTable
        computers={rows}
        isAdmin={isAdminRole(session?.user?.role)}
      />
    </>
  );
}
