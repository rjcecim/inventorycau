import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loadMonitorFormOptions } from "@/lib/asset-form";
import { PageHeader } from "@/components/PageHeader";
import { MonitorMover } from "@/components/MonitorMover";
import { listGroupMembers } from "@/lib/equipamento-grupo";

export const dynamic = "force-dynamic";

export default async function MoverMonitorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;
  const [monitor, options, members] = await Promise.all([
    prisma.monitor.findFirst({ where: { id, deletedAt: null } }),
    loadMonitorFormOptions(),
    listGroupMembers("MONITOR", id),
  ]);
  if (!monitor) notFound();

  return (
    <>
      <p className="mb-2 text-xs font-medium text-slate-500">
        <Link href="/monitores" className="hover:underline">Monitores</Link>
        {" / "}
        <Link href={`/monitores/${monitor.id}`} className="hover:underline">{monitor.tombo}</Link>
        {" / Mover"}
      </p>
      <PageHeader
        title={`Mover ${monitor.tombo}`}
        description="Altere usuário, setor, prédio ou status. Dados técnicos não são alterados aqui."
      />
      <MonitorMover
        monitor={{
          id: monitor.id,
          tombo: monitor.tombo,
          status: monitor.status,
          servidorId: monitor.servidorId,
          departamentoId: monitor.departamentoId,
          localizacaoId: monitor.localizacaoId,
        }}
        departments={options.departments}
        locations={options.locations}
        people={options.people}
        grouped={members.length >= 2}
        cancelHref={`/monitores/${monitor.id}`}
      />
    </>
  );
}
