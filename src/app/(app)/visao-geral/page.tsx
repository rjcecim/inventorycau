import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { VisaoGeralTable } from "@/components/VisaoGeralTable";
import { setorLabel } from "@/lib/alocacao";

function assetModelo(item: { fabricante?: string | null; modelo?: string | null }) {
  return [item.fabricante, item.modelo].filter(Boolean).join(" ");
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
          select: { id: true, tombo: true, fabricante: true, modelo: true },
        },
      },
    }),
    prisma.monitor.findMany({
      where: { deletedAt: null, computadorId: null, departamentoId: { not: null } },
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
    modelo: assetModelo(item),
    status: item.status,
    usuario: item.servidor?.nome || item.usuario || "",
    monitores: item.monitores.map((monitor) => ({
      id: monitor.id,
      tombo: monitor.tombo,
      modelo: assetModelo(monitor),
    })),
  }));

  const monitorUsuario = (item: (typeof sectorMonitors)[number]) => item.servidor?.nome || item.usuario || "";
  const monitorUsuarioKey = (item: (typeof sectorMonitors)[number]) => item.servidorId || item.usuario || "sem-usuario";

  const monitorsBySetorPredioUsuario = new Map<string, typeof sectorMonitors>();
  for (const item of sectorMonitors) {
    const key = `${item.departamentoId ?? "sem-setor"}::${item.localizacaoId ?? "sem-predio"}::${monitorUsuarioKey(item)}::${item.status}`;
    const group = monitorsBySetorPredioUsuario.get(key) ?? [];
    group.push(item);
    monitorsBySetorPredioUsuario.set(key, group);
  }

  const monitorRows = Array.from(monitorsBySetorPredioUsuario.values()).map((group) => {
    const first = group[0];
    const modelos = [...new Set(group.map(assetModelo).filter(Boolean))];
    return {
      id: `setor-mon-${first.departamentoId ?? first.id}-${first.localizacaoId ?? "sem-predio"}-${monitorUsuarioKey(first)}-${first.status}`,
      kind: "monitor" as const,
      href: `/monitores/${first.id}`,
      setor: setorLabel(first.departamento),
      predio: first.localizacao?.nome ?? "",
      computadorTombo: "",
      modelo: modelos.join(", "),
      status: first.status,
      usuario: monitorUsuario(first),
      monitores: group.map((item) => ({ id: item.id, tombo: item.tombo, modelo: assetModelo(item) })),
    };
  });

  const rows = [...computerRows, ...monitorRows].sort((a, b) => {
    const bySetor = (a.setor || "\uffff").localeCompare(b.setor || "\uffff", "pt-BR");
    if (bySetor !== 0) return bySetor;
    const byPredio = (a.predio || "\uffff").localeCompare(b.predio || "\uffff", "pt-BR");
    if (byPredio !== 0) return byPredio;
    if (a.kind !== b.kind) return a.kind === "computer" ? -1 : 1;
    const byUsuario = (a.usuario || "\uffff").localeCompare(b.usuario || "\uffff", "pt-BR");
    if (byUsuario !== 0) return byUsuario;
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
        description="Equipamentos por setor: computadores com seus monitores e monitores alocados somente ao setor."
      />
      <VisaoGeralTable rows={rows} />
    </>
  );
}
