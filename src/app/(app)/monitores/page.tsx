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

  const [monitors, departments, locations, computers, people] = await Promise.all([
    prisma.monitor.findMany({
      where: { deletedAt: null, ...(status ? { status } : {}) },
      orderBy: { tombo: "asc" },
      include: { departamento: true, computador: true },
    }),
    prisma.departamento.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.localizacao.findMany({ orderBy: { nome: "asc" } }),
    prisma.computador.findMany({ where: { deletedAt: null }, orderBy: { tombo: "asc" } }),
    prisma.servidor.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      include: { departamento: true },
    }),
  ]);

  return (
    <>
      <PageHeader title="Monitores" description="Ativos independentes, com vínculo opcional a um computador." />
      <MonitorTable
        monitors={monitors}
        departments={departments}
        locations={locations}
        computers={computers}
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
