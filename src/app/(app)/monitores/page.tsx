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
      computador: { include: { departamento: true, localizacao: true } },
    },
  });

  return (
    <>
      <PageHeader title="Monitores" description="Inventário de monitores. Use o filtro no cabeçalho de cada coluna, como no Excel." />
      <MonitorTable
        monitors={monitors}
        isAdmin={isAdminRole(session?.user?.role)}
      />
    </>
  );
}
