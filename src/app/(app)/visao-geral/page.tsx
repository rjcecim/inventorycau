import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { VisaoGeralTable } from "@/components/VisaoGeralTable";
import { setorLabel } from "@/lib/alocacao";
import { formatPredio } from "@/lib/predios";

function assetModelo(item: { modelo?: string | null }) {
  return item.modelo?.trim() || "";
}

function usuarioLabel(item: { servidor?: { nome: string } | null; usuario?: string | null }) {
  return item.servidor?.nome || item.usuario || "";
}

export const dynamic = "force-dynamic";

export default async function VisaoGeralPage() {
  const [computers, monitors] = await Promise.all([
    prisma.computador.findMany({
      where: { deletedAt: null },
      include: { departamento: true, localizacao: true, servidor: true },
      orderBy: { tombo: "asc" },
    }),
    prisma.monitor.findMany({
      where: { deletedAt: null },
      include: { departamento: true, localizacao: true, servidor: true },
      orderBy: { tombo: "asc" },
    }),
  ]);

  const groups = new Map<string, { computers: typeof computers; monitors: typeof monitors }>();
  const ungroupedComputers: typeof computers = [];
  const ungroupedMonitors: typeof monitors = [];

  for (const item of computers) {
    if (!item.groupId) {
      ungroupedComputers.push(item);
      continue;
    }
    const group = groups.get(item.groupId) ?? { computers: [] as typeof computers, monitors: [] as typeof monitors };
    group.computers.push(item);
    groups.set(item.groupId, group);
  }
  for (const item of monitors) {
    if (!item.groupId) {
      ungroupedMonitors.push(item);
      continue;
    }
    const group = groups.get(item.groupId) ?? { computers: [] as typeof computers, monitors: [] as typeof monitors };
    group.monitors.push(item);
    groups.set(item.groupId, group);
  }

  const groupedRows = [...groups.entries()].map(([groupId, group]) => {
    const lead = group.computers[0] ?? group.monitors[0];
    return {
      id: `grp-${groupId}`,
      kind: (group.computers.length ? "computer" : "monitor") as "computer" | "monitor",
      href: group.computers[0] ? `/computadores/${group.computers[0].id}` : `/monitores/${group.monitors[0].id}`,
      setor: setorLabel(lead.departamento),
      predio: formatPredio(lead.localizacao) || lead.localizacao?.nome || "",
      computadorTombo: group.computers.map((item) => item.tombo).join(", "),
      modeloComputador: group.computers.map(assetModelo).filter(Boolean).join(", "),
      status: lead.status,
      usuario: usuarioLabel(lead),
      computadores: group.computers.map((item) => ({ id: item.id, tombo: item.tombo, modelo: assetModelo(item) })),
      monitores: group.monitors.map((item) => ({ id: item.id, tombo: item.tombo, modelo: assetModelo(item) })),
    };
  });

  const computerRows = ungroupedComputers.map((item) => ({
    id: `pc-${item.id}`,
    kind: "computer" as const,
    href: `/computadores/${item.id}`,
    setor: setorLabel(item.departamento),
    predio: formatPredio(item.localizacao) || item.localizacao?.nome || "",
    computadorTombo: item.tombo,
    modeloComputador: assetModelo(item),
    status: item.status,
    usuario: usuarioLabel(item),
    computadores: [{ id: item.id, tombo: item.tombo, modelo: assetModelo(item) }],
    monitores: [],
  }));

  const monitorRows = ungroupedMonitors.map((item) => ({
    id: `mon-${item.id}`,
    kind: "monitor" as const,
    href: `/monitores/${item.id}`,
    setor: setorLabel(item.departamento),
    predio: formatPredio(item.localizacao) || item.localizacao?.nome || "",
    computadorTombo: "",
    modeloComputador: "",
    status: item.status,
    usuario: usuarioLabel(item),
    computadores: [],
    monitores: [{ id: item.id, tombo: item.tombo, modelo: assetModelo(item) }],
  }));

  const rows = [...groupedRows, ...computerRows, ...monitorRows].sort((a, b) => {
    const bySetor = (a.setor || "\uffff").localeCompare(b.setor || "\uffff", "pt-BR");
    if (bySetor !== 0) return bySetor;
    const byPredio = (a.predio || "\uffff").localeCompare(b.predio || "\uffff", "pt-BR");
    if (byPredio !== 0) return byPredio;
    return (a.computadorTombo || a.monitores[0]?.tombo || "").localeCompare(
      b.computadorTombo || b.monitores[0]?.tombo || "",
      "pt-BR",
      { numeric: true },
    );
  });

  return (
    <>
      <PageHeader
        title="Visão Geral"
        description="Uma linha por agrupamento ou equipamento. Use o filtro no cabeçalho de cada coluna, como no Excel."
      />
      <VisaoGeralTable rows={rows} />
    </>
  );
}
