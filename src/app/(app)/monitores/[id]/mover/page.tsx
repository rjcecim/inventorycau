import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loadMonitorFormOptions } from "@/lib/asset-form";
import { PageHeader } from "@/components/PageHeader";
import { MonitorMover } from "@/components/MonitorMover";

export const dynamic = "force-dynamic";

export default async function MoverMonitorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;
  const [monitor, options] = await Promise.all([
    prisma.monitor.findFirst({ where: { id, deletedAt: null } }),
    loadMonitorFormOptions(),
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
        description="Associe a um computador ou aloque a setor, usuário e prédio. Dados técnicos não são alterados aqui."
      />
      <MonitorMover
        monitor={{
          id: monitor.id,
          tombo: monitor.tombo,
          status: monitor.status,
          servidorId: monitor.servidorId,
          departamentoId: monitor.departamentoId,
          localizacaoId: monitor.localizacaoId,
          computadorId: monitor.computadorId,
        }}
        departments={options.departments}
        locations={options.locations}
        computers={options.computers}
        people={options.people}
        cancelHref={`/monitores/${monitor.id}`}
      />
    </>
  );
}
