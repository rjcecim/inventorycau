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
    include: { departamento: true, localizacao: true, _count: { select: { monitores: true } } },
  });

  return (
    <>
      <PageHeader title="Computadores" description="Inventário de estações. Use o filtro no cabeçalho de cada coluna, como no Excel." />
      <ComputerTable
        computers={computers}
        isAdmin={isAdminRole(session?.user?.role)}
      />
    </>
  );
}
