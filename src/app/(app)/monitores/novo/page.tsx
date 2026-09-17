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
  const { departments, locations, people } = await loadMonitorFormOptions();

  return (
    <>
      <p className="mb-2 text-xs font-medium text-slate-500">
        <Link href="/monitores" className="hover:underline">Monitores</Link>
        {" / Novo"}
      </p>
      <PageHeader
        title="Novo monitor"
        description="Cadastre um monitor ou um lote pela faixa de patrimônios. Depois de salvar um, você vai para a ficha; o lote volta para a lista."
      />
      <MonitorEditor
        departments={departments}
        locations={locations}
        people={people}
        cancelHref="/monitores"
      />
    </>
  );
}
