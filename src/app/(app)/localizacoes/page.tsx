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
    orderBy: { nome: "asc" },
    include: { _count: { select: { computadores: true } } },
  });

  return (
    <>
      <PageHeader title="Localizações" description="Onde os equipamentos estão fisicamente." />
      <OrganizationManager
        title="Localização"
        extraFields
        isAdmin={isAdminRole(session?.user?.role)}
        saveAction={saveLocalizacao}
        deleteAction={deleteLocalizacao}
        items={locations.map((item) => ({
          id: item.id,
          nome: item.nome,
          predio: item.predio,
          andar: item.andar,
          sala: item.sala,
          count: item._count.computadores,
        }))}
      />
    </>
  );
}
