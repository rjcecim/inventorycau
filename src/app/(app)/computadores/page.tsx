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

  const [computers, departments, locations, people] = await Promise.all([
    prisma.computador.findMany({
      where: { deletedAt: null, ...(status ? { status } : {}) },
      orderBy: { tombo: "asc" },
      include: { departamento: true, localizacao: true, _count: { select: { monitores: true } } },
    }),
    prisma.departamento.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.localizacao.findMany({ orderBy: [{ cidade: "asc" }, { nome: "asc" }] }),
    prisma.servidor.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      include: { departamento: true },
    }),
  ]);

  return (
    <>
      <PageHeader title="Computadores" description="Inventário de estações, com filtros por status, setor e prédio." />
      <ComputerTable
        computers={computers}
        departments={departments}
        locations={locations}
        people={people.map((p) => ({
          id: p.id,
          nome: p.nome,
          departamentoCodigo: p.departamento.codigo,
          departamentoNome: p.departamento.nome,
        }))}
        isAdmin={isAdminRole(session?.user?.role)}
      />
    </>
  );
}
