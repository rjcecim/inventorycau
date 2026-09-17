import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/authz";
import { loadMonitorFormOptions, toMonitorFormValues } from "@/lib/asset-form";
import { PageHeader } from "@/components/PageHeader";
import { MonitorEditor } from "@/components/MonitorEditor";

export const dynamic = "force-dynamic";

export default async function EditarMonitorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdminRole(session?.user?.role)) redirect("/monitores");
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
        {" / Editar"}
      </p>
      <PageHeader
        title={`Editar ${monitor.tombo}`}
        description="Altere os dados do monitor e salve para atualizar o inventário."
      />
      <MonitorEditor
        monitor={toMonitorFormValues(monitor)}
        departments={options.departments}
        locations={options.locations}
        people={options.people}
        cancelHref={`/monitores/${monitor.id}`}
      />
    </>
  );
}
