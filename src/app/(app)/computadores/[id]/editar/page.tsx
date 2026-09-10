import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/authz";
import { loadComputerFormOptions, toComputerFormValues } from "@/lib/asset-form";
import { PageHeader } from "@/components/PageHeader";
import { ComputerEditor } from "@/components/ComputerEditor";

export const dynamic = "force-dynamic";

export default async function EditarComputadorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdminRole(session?.user?.role)) redirect("/computadores");
  const { id } = await params;
  const [computer, options] = await Promise.all([
    prisma.computador.findFirst({ where: { id, deletedAt: null } }),
    loadComputerFormOptions(),
  ]);
  if (!computer) notFound();

  return (
    <>
      <p className="mb-2 text-xs font-medium text-slate-500">
        <Link href="/computadores" className="hover:underline">Computadores</Link>
        {" / "}
        <Link href={`/computadores/${computer.id}`} className="hover:underline">{computer.tombo}</Link>
        {" / Editar"}
      </p>
      <PageHeader
        title={`Editar ${computer.tombo}`}
        description="Altere os dados do computador e salve para atualizar o inventário."
      />
      <ComputerEditor
        computer={toComputerFormValues(computer)}
        departments={options.departments}
        locations={options.locations}
        people={options.people}
        cancelHref={`/computadores/${computer.id}`}
      />
    </>
  );
}
