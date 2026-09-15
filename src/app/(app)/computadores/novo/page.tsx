import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/authz";
import { loadComputerFormOptions } from "@/lib/asset-form";
import { PageHeader } from "@/components/PageHeader";
import { ComputerEditor } from "@/components/ComputerEditor";

export const dynamic = "force-dynamic";

export default async function NovoComputadorPage() {
  const session = await auth();
  if (!isAdminRole(session?.user?.role)) redirect("/computadores");
  const { departments, locations, people } = await loadComputerFormOptions();

  return (
    <>
      <p className="mb-2 text-xs font-medium text-slate-500">
        <Link href="/computadores" className="hover:underline">Computadores</Link>
        {" / Novo"}
      </p>
      <PageHeader
        title="Novo computador"
        description="Cadastre um equipamento ou um lote pela faixa de patrimônios. Depois de salvar um, você vai para a ficha; o lote volta para a lista."
      />
      <ComputerEditor
        departments={departments}
        locations={locations}
        people={people}
        cancelHref="/computadores"
      />
    </>
  );
}
