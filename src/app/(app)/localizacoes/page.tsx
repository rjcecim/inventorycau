import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/authz";
import { PageHeader } from "@/components/PageHeader";
import { OrganizationManager } from "@/components/OrganizationManager";
import { saveLocalizacao, deleteLocalizacao } from "@/app/actions/organizacao";

export const dynamic = "force-dynamic";

export default async function LocalizacoesPage() {
  const session = await auth();
  const locations = await prisma.localizacao.findMany({
    orderBy: [{ cidade: "asc" }, { nome: "asc" }],
    include: { _count: { select: { computadores: true, monitores: true } } },
  });

  return (
    <>
      <PageHeader
        title="Prédios"
        description="Cadastre os prédios do órgão, inclusive em cidades diferentes. Ao registrar um computador, associe o setor e o prédio."
      />
      <OrganizationManager
        title="Prédio"
        isAdmin={isAdminRole(session?.user?.role)}
        saveAction={saveLocalizacao}
        deleteAction={deleteLocalizacao}
        items={locations.map((item) => ({
          id: item.id,
          nome: item.nome,
          cidade: item.cidade,
          uf: item.uf,
          computers: item._count.computadores,
          monitors: item._count.monitores,
        }))}
      />
    </>
  );
}
