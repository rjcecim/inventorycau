import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { VisaoGeralTable } from "@/components/VisaoGeralTable";
import { setorLabel } from "@/lib/alocacao";

function assetModelo(item: { modelo?: string | null }) {
  return item.modelo?.trim() || "";
}

function usuarioLabel(item: { servidor?: { nome: string } | null; usuario?: string | null }) {
  return item.servidor?.nome || item.usuario || "";
}

export const dynamic = "force-dynamic";

export default async function VisaoGeralPage() {
  const [computers, sectorMonitors] = await Promise.all([
    prisma.computador.findMany({
      where: { deletedAt: null },
      include: {
        departamento: true,
        localizacao: true,
        servidor: true,
        monitores: {
          where: { deletedAt: null },
          orderBy: { tombo: "asc" },
          select: { id: true, tombo: true, modelo: true },
        },
      },
      orderBy: { tombo: "asc" },
    }),
    prisma.monitor.findMany({
      where: { deletedAt: null, computadorId: null },
      include: { departamento: true, localizacao: true, servidor: true },
      orderBy: { tombo: "asc" },
    }),
  ]);

  const computerRows = computers.map((item) => ({
    id: `pc-${item.id}`,
    kind: "computer" as const,
    href: `/computadores/${item.id}`,
    setor: setorLabel(item.departamento),
    predio: item.localizacao?.nome ?? "",
    computadorTombo: item.tombo,
    modeloComputador: assetModelo(item),
    status: item.status,
    usuario: usuarioLabel(item),
    monitores: item.monitores.map((monitor) => ({
      id: monitor.id,
      tombo: monitor.tombo,
      modelo: assetModelo(monitor),
    })),
  }));

  const monitorRows = sectorMonitors.map((item) => ({
    id: `mon-${item.id}`,
    kind: "monitor" as const,
    href: `/monitores/${item.id}`,
    setor: setorLabel(item.departamento),
    predio: item.localizacao?.nome ?? "",
    computadorTombo: "",
    modeloComputador: "",
    status: item.status,
    usuario: usuarioLabel(item),
    monitores: [{ id: item.id, tombo: item.tombo, modelo: assetModelo(item) }],
  }));

  const rows = [...computerRows, ...monitorRows].sort((a, b) => {
    const bySetor = (a.setor || "\uffff").localeCompare(b.setor || "\uffff", "pt-BR");
    if (bySetor !== 0) return bySetor;
    const byPredio = (a.predio || "\uffff").localeCompare(b.predio || "\uffff", "pt-BR");
    if (byPredio !== 0) return byPredio;
    if (a.kind !== b.kind) return a.kind === "computer" ? -1 : 1;
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
        description="Uma linha por equipamento. Use o filtro no cabeçalho de cada coluna, como no Excel."
      />
      <VisaoGeralTable rows={rows} />
    </>
  );
}
