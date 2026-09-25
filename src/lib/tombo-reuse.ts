import type { Prisma } from "@prisma/client";

function retireValue(value: string, id: string) {
  return `${value}#${id}`;
}

export function retireAssetKeys(id: string, tombo: string, serialNumber: string | null) {
  return {
    tombo: retireValue(tombo, id),
    serialNumber: serialNumber ? retireValue(serialNumber, id) : null,
  };
}

type Occupied = { id: string; tombo: string; serialNumber: string | null; deletedAt: Date | null };

function duplicateError(active: Occupied[]) {
  if (active.length === 1) {
    return { error: `O patrimônio ${active[0].tombo} já está cadastrado.` };
  }
  const sample = active.slice(0, 8).map((item) => item.tombo).join(", ");
  const extra = active.length > 8 ? ` e mais ${active.length - 8}` : "";
  return { error: `Já existem ${active.length} patrimônios nessa faixa: ${sample}${extra}.` };
}

export async function releaseDeletedTombos(
  tx: Prisma.TransactionClient,
  kind: "COMPUTER" | "NOTEBOOK" | "MONITOR",
  tombos: string[],
): Promise<{ error: string } | { ok: true }> {
  const rows: Occupied[] =
    kind === "COMPUTER" || kind === "NOTEBOOK"
      ? await tx.computador.findMany({
          where: { tombo: { in: tombos } },
          select: { id: true, tombo: true, serialNumber: true, deletedAt: true },
          orderBy: { tombo: "asc" },
        })
      : await tx.monitor.findMany({
          where: { tombo: { in: tombos } },
          select: { id: true, tombo: true, serialNumber: true, deletedAt: true },
          orderBy: { tombo: "asc" },
        });

  const active = rows.filter((row) => !row.deletedAt);
  if (active.length) return duplicateError(active);

  for (const row of rows) {
    const data = retireAssetKeys(row.id, row.tombo, row.serialNumber);
    if (kind === "COMPUTER" || kind === "NOTEBOOK") {
      await tx.computador.update({ where: { id: row.id }, data });
    } else {
      await tx.monitor.update({ where: { id: row.id }, data });
    }
  }
  return { ok: true };
}
