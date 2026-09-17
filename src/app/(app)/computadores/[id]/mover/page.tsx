import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loadComputerFormOptions } from "@/lib/asset-form";
import { PageHeader } from "@/components/PageHeader";
import { ComputerMover } from "@/components/ComputerMover";
import { listGroupMembers } from "@/lib/equipamento-grupo";

export const dynamic = "force-dynamic";

export default async function MoverComputadorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;
  const [computer, options, members] = await Promise.all([
    prisma.computador.findFirst({ where: { id, deletedAt: null } }),
    loadComputerFormOptions(),
    listGroupMembers("COMPUTER", id),
  ]);
  if (!computer) notFound();

  return (
    <>
      <p className="mb-2 text-xs font-medium text-slate-500">
        <Link href="/computadores" className="hover:underline">Computadores</Link>
        {" / "}
        <Link href={`/computadores/${computer.id}`} className="hover:underline">{computer.tombo}</Link>
        {" / Mover"}
      </p>
      <PageHeader
        title={`Mover ${computer.tombo}`}
        description="Altere usuário, setor, prédio ou status. Dados técnicos do equipamento não são alterados aqui."
      />
      <ComputerMover
        computer={{
          id: computer.id,
          tombo: computer.tombo,
          status: computer.status,
          servidorId: computer.servidorId,
          departamentoId: computer.departamentoId,
          localizacaoId: computer.localizacaoId,
        }}
        departments={options.departments}
        locations={options.locations}
        people={options.people}
        grouped={members.length >= 2}
        cancelHref={`/computadores/${computer.id}`}
      />
    </>
  );
}
