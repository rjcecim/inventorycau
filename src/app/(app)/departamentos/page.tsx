import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/authz";
import { PageHeader } from "@/components/PageHeader";
import { SetoresManager } from "@/components/SetoresManager";

export const dynamic = "force-dynamic";

export default async function DepartamentosPage() {
  const session = await auth();
  const departments = await prisma.departamento.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          computadores: { where: { deletedAt: null } },
          monitores: { where: { deletedAt: null } },
        },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="Setores"
        description="Lotações oficiais. As colunas Computadores e Monitores contam os equipamentos associados a cada setor."
      />
      <SetoresManager
        isAdmin={isAdminRole(session?.user?.role)}
        items={departments.map((item) => ({
          id: item.id,
          codigo: item.codigo,
          nome: item.nome,
          nivel: item.nivel,
          parentId: item.parentId,
          computadores: item._count.computadores,
          monitores: item._count.monitores,
        }))}
      />
    </>
  );
}
