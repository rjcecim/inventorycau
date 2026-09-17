import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { MovementTimeline } from "@/components/MovementTimeline";

export const dynamic = "force-dynamic";

export default async function MovimentacoesPage() {
  const items = await prisma.movimentacao.findMany({
    orderBy: { createdDate: "desc" },
    include: { actor: true, computador: true, monitor: true },
  });

  return (
    <>
      <PageHeader title="Movimentações" description="Histórico de alterações de status, alocação e vínculos." />
      <div className="surface p-5">
        <MovementTimeline items={items} showAsset />
      </div>
    </>
  );
}
