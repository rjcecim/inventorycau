import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/authz";
import { loadMonitorFormOptions } from "@/lib/asset-form";
import { PageHeader } from "@/components/PageHeader";
import { MonitorEditor } from "@/components/MonitorEditor";

export const dynamic = "force-dynamic";

export default async function NovoMonitorPage() {
  const session = await auth();
  if (!isAdminRole(session?.user?.role)) redirect("/monitores");
  const { departments, locations, people, computers } = await loadMonitorFormOptions();

  return (
    <>
      <p className="mb-2 text-xs font-medium text-slate-500">
        <Link href="/monitores" className="hover:underline">Monitores</Link>
        {" / Novo"}
      </p>
      <PageHeader
        title="Novo monitor"
        description="Preencha os dados do monitor. Depois de salvar, você volta para a ficha."
      />
      <MonitorEditor
        departments={departments}
        locations={locations}
        computers={computers}
        people={people}
        cancelHref="/monitores"
      />
    </>
  );
}
