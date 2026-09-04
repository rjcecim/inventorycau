import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/authz";
import { PageHeader } from "@/components/PageHeader";
import { UsuariosManager } from "@/components/UsuariosManager";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const session = await auth();
  const [people, departments] = await Promise.all([
    prisma.servidor.findMany({
      orderBy: { nome: "asc" },
      include: { departamento: true },
    }),
    prisma.departamento.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Cadastre pessoas e associe cada uma a um setor. Essa contagem alimenta a coluna Usuários em Setores."
      />
      <UsuariosManager
        people={people}
        departments={departments}
        isAdmin={isAdminRole(session?.user?.role)}
      />
    </>
  );
}
