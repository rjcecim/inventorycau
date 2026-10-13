import { prisma } from "@/lib/prisma";

export type CustodyItem = {
  tipo: string;
  tombo: string;
  modelo: string;
  serialNumber: string;
  observacoes?: string;
};

function line(
  tipo: string,
  item: { tombo: string; modelo?: string | null; serialNumber?: string | null; observacoes?: string | null },
): CustodyItem {
  return {
    tipo,
    tombo: item.tombo,
    modelo: item.modelo?.trim() || "—",
    serialNumber: item.serialNumber?.trim() || "—",
    observacoes: item.observacoes?.trim() || "",
  };
}

export async function custodyItemsForGroup(
  members: Array<{ kind: "COMPUTER" | "MONITOR"; id: string }>,
  fallback: CustodyItem,
) {
  if (members.length < 2) return [fallback];
  const computerIds = members.filter((item) => item.kind === "COMPUTER").map((item) => item.id);
  const monitorIds = members.filter((item) => item.kind === "MONITOR").map((item) => item.id);
  const [computers, monitors] = await Promise.all([
    computerIds.length
      ? prisma.computador.findMany({
          where: { id: { in: computerIds }, deletedAt: null },
          orderBy: { tombo: "asc" },
          select: { tombo: true, modelo: true, serialNumber: true, tipo: true, observacoes: true },
        })
      : [],
    monitorIds.length
      ? prisma.monitor.findMany({
          where: { id: { in: monitorIds }, deletedAt: null },
          orderBy: { tombo: "asc" },
          select: { tombo: true, modelo: true, serialNumber: true },
        })
      : [],
  ]);
  return [
    ...computers.map((item) => line(item.tipo === "NOTEBOOK" ? "Notebook" : "Computador", item)),
    ...monitors.map((item) => line("Monitor", item)),
  ];
}

export function singleCustodyItem(
  tipo: string,
  item: { tombo: string; modelo?: string | null; serialNumber?: string | null; observacoes?: string | null },
) {
  return line(tipo, item);
}
