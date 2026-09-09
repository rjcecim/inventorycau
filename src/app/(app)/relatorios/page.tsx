import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

const reports = [
  { tipo: "departamento", label: "Por departamento" },
  { tipo: "status", label: "Por status" },
  { tipo: "sem-monitor", label: "Computadores sem monitor" },
  { tipo: "sem-computador", label: "Monitores sem computador" },
  { tipo: "manutencao", label: "Em manutenção" },
  { tipo: "baixados", label: "Baixados" },
] as const;

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo = "departamento" } = await searchParams;

  let computers = await prisma.computador.findMany({
    where: { deletedAt: null },
    include: { departamento: true, localizacao: true, monitores: { where: { deletedAt: null } } },
    orderBy: { tombo: "asc" },
  });
  let monitors = await prisma.monitor.findMany({
    where: { deletedAt: null },
    include: { computador: true, departamento: true },
    orderBy: { tombo: "asc" },
  });

  if (tipo === "sem-monitor") computers = computers.filter((item) => item.monitores.length === 0);
  if (tipo === "manutencao") computers = computers.filter((item) => item.status === "MAINTENANCE");
  if (tipo === "baixados") computers = computers.filter((item) => item.status === "DISPOSED");
  if (tipo === "sem-computador") monitors = monitors.filter((item) => !item.computadorId);
  if (tipo === "manutencao") monitors = monitors.filter((item) => item.status === "MAINTENANCE");
  if (tipo === "baixados") monitors = monitors.filter((item) => item.status === "DISPOSED");

  const showMonitors = tipo === "sem-computador" || tipo === "manutencao" || tipo === "baixados" || tipo === "status";

  return (
    <>
      <PageHeader title="Relatórios" description="Recortes rápidos do inventário para operação e conferência." />
      <div className="mb-4 flex flex-wrap gap-2">
        {reports.map((item) => (
          <Link
            key={item.tipo}
            href={`/relatorios?tipo=${item.tipo}`}
            className={`rounded-lg px-3 py-1.5 text-sm ${tipo === item.tipo ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-line"}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-line bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Patrimônio</th>
              <th className="px-4 py-3">Identificação</th>
              <th className="px-4 py-3">Departamento</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(tipo === "sem-computador" ? [] : computers).map((item) => (
              <tr key={`c-${item.id}`} className="border-b border-line">
                <td className="px-4 py-3">Computador</td>
                <td className="px-4 py-3 font-medium">
                  <Link className="text-brand hover:underline" href={`/computadores/${item.id}`}>{item.tombo}</Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{item.usuario || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{item.departamento?.nome || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
              </tr>
            ))}
            {showMonitors ? monitors.map((item) => (
              <tr key={`m-${item.id}`} className="border-b border-line">
                <td className="px-4 py-3">Monitor</td>
                <td className="px-4 py-3 font-medium">
                  <Link className="text-brand hover:underline" href={`/monitores/${item.id}`}>{item.tombo}</Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{item.computador?.tombo || item.usuario || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{item.departamento?.nome || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
              </tr>
            )) : null}
          </tbody>
        </table>
        {!computers.length && !(showMonitors && monitors.length) ? (
          <EmptyState title="Nenhum registro neste recorte" />
        ) : null}
      </div>
    </>
  );
}
