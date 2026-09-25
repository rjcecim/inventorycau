import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { monitorAlocacao, setorLabel } from "@/lib/alocacao";
import { computerRowKind, inventoryKindHref, inventoryKindLabel } from "@/lib/inventory-kind";
import type { AssetStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const reports = [
  { tipo: "departamento", label: "Por departamento" },
  { tipo: "status", label: "Por status" },
  { tipo: "sem-setor", label: "PCs sem setor" },
  { tipo: "sem-predio", label: "PCs sem prédio" },
  { tipo: "sem-usuario", label: "PCs sem usuário" },
  { tipo: "sem-monitor", label: "Computadores sem monitor" },
  { tipo: "sem-computador", label: "Monitores sem computador" },
  { tipo: "monitor-sem-alocacao", label: "Monitores sem PC e sem setor" },
  { tipo: "reserva", label: "Em reserva" },
  { tipo: "manutencao", label: "Em manutenção" },
  { tipo: "aguardando", label: "Aguardando instalação" },
  { tipo: "baixados", label: "Baixados" },
] as const;

type ReportTipo = (typeof reports)[number]["tipo"];

function hasUsuario(item: { servidorId?: string | null; usuario: string | null }) {
  return Boolean(item.servidorId || item.usuario?.trim());
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const raw = (await searchParams).tipo ?? "departamento";
  const tipo = (reports.some((item) => item.tipo === raw) ? raw : "departamento") as ReportTipo;

  let computers = await prisma.computador.findMany({
    where: { deletedAt: null },
    include: {
      departamento: true,
      localizacao: true,
      servidor: true,
    },
    orderBy: { tombo: "asc" },
  });
  let monitors = await prisma.monitor.findMany({
    where: { deletedAt: null },
    include: {
      departamento: true,
      servidor: true,
    },
    orderBy: { tombo: "asc" },
  });
  const desktops = computers.filter((item) => item.tipo !== "NOTEBOOK");
  const pcGroups = new Set(desktops.map((item) => item.groupId).filter((id): id is string => Boolean(id)));
  const monGroups = new Set(monitors.map((item) => item.groupId).filter((id): id is string => Boolean(id)));

  if (tipo === "sem-setor") computers = computers.filter((item) => !item.departamentoId);
  if (tipo === "sem-predio") computers = computers.filter((item) => !item.localizacaoId);
  if (tipo === "sem-usuario") computers = computers.filter((item) => !hasUsuario(item));
  if (tipo === "sem-monitor") {
    computers = computers.filter((item) => item.tipo !== "NOTEBOOK" && (!item.groupId || !monGroups.has(item.groupId)));
  }
  if (tipo === "manutencao") computers = computers.filter((item) => item.status === "MAINTENANCE");
  if (tipo === "baixados") computers = computers.filter((item) => item.status === "DISPOSED");
  if (tipo === "reserva") computers = computers.filter((item) => item.status === "RESERVE");
  if (tipo === "aguardando") computers = computers.filter((item) => item.status === "AWAITING_INSTALL");

  if (tipo === "sem-computador") monitors = monitors.filter((item) => !item.groupId || !pcGroups.has(item.groupId));
  if (tipo === "monitor-sem-alocacao") {
    monitors = monitors.filter((item) => (!item.groupId || !pcGroups.has(item.groupId)) && !item.departamentoId);
  }
  if (tipo === "manutencao") monitors = monitors.filter((item) => item.status === "MAINTENANCE");
  if (tipo === "baixados") monitors = monitors.filter((item) => item.status === "DISPOSED");
  if (tipo === "reserva") monitors = monitors.filter((item) => item.status === "RESERVE");
  if (tipo === "aguardando") monitors = monitors.filter((item) => item.status === "AWAITING_INSTALL");

  const onlyMonitors = tipo === "sem-computador" || tipo === "monitor-sem-alocacao";
  const onlyComputers =
    tipo === "sem-setor" ||
    tipo === "sem-predio" ||
    tipo === "sem-usuario" ||
    tipo === "sem-monitor";
  const showMonitors =
    !onlyComputers &&
    (tipo === "sem-computador" ||
      tipo === "monitor-sem-alocacao" ||
      tipo === "manutencao" ||
      tipo === "baixados" ||
      tipo === "reserva" ||
      tipo === "aguardando" ||
      tipo === "status" ||
      tipo === "departamento");
  const showComputers = !onlyMonitors;

  return (
    <>
      <PageHeader title="Relatórios" description="Recortes rápidos do inventário para operação e conferência." />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Link
          href="/relatorios/garantias"
          className="surface block p-4 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <p className="text-sm font-semibold text-slate-900">Garantias</p>
          <p className="mt-1 text-xs text-slate-500">
            Vencimento, dias restantes e situação por equipamento (PC, notebooks e monitores).
          </p>
        </Link>
        <Link
          href="/relatorios/modernizacao"
          className="surface block p-4 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <p className="text-sm font-semibold text-slate-900">Modernização</p>
          <p className="mt-1 text-xs text-slate-500">
            Índices por categoria, prazos de 6/8 anos e apurações anuais salvas.
          </p>
        </Link>
      </div>
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
      <div className="surface overflow-x-auto">
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
            {showComputers
              ? computers.map((item) => (
                  <tr key={`c-${item.id}`} className="border-b border-line">
                    <td className="px-4 py-3">{inventoryKindLabel(computerRowKind(item.tipo))}</td>
                    <td className="px-4 py-3 font-medium">
                      <Link className="text-brand hover:underline" href={inventoryKindHref(computerRowKind(item.tipo), item.id)}>
                        {item.tombo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.servidor?.nome || item.usuario || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{setorLabel(item.departamento) || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status as AssetStatus} />
                    </td>
                  </tr>
                ))
              : null}
            {showMonitors
              ? monitors.map((item) => {
                  const aloc = monitorAlocacao(item);
                  return (
                    <tr key={`m-${item.id}`} className="border-b border-line">
                      <td className="px-4 py-3">Monitor</td>
                      <td className="px-4 py-3 font-medium">
                        <Link className="text-brand hover:underline" href={`/monitores/${item.id}`}>
                          {item.tombo}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.servidor?.nome || item.usuario || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {setorLabel(aloc.departamento) || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={aloc.status} />
                      </td>
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
        {!(showComputers && computers.length) && !(showMonitors && monitors.length) ? (
          <EmptyState title="Nenhum registro neste recorte" />
        ) : null}
      </div>
    </>
  );
}
