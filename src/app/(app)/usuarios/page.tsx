import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/authz";
import { PageHeader } from "@/components/PageHeader";
import { UsuariosManager } from "@/components/UsuariosManager";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const session = await auth();
  const people = await prisma.servidor.findMany({
    orderBy: { nome: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Cadastre pessoas com nome, matrícula e cargo para associá-las aos equipamentos."
      />
      <UsuariosManager
        people={people}
        isAdmin={isAdminRole(session?.user?.role)}
      />
    </>
  );
}
