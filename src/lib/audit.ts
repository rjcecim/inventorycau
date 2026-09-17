import { AssetKind, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Change = { campo: string; anterior?: string | null; novo?: string | null };

export async function logChanges(params: {
  kind: AssetKind;
  computadorId?: string | null;
  monitorId?: string | null;
  actorId?: string | null;
  changes: Change[];
  tx?: Prisma.TransactionClient;
}) {
  const relevant = params.changes.filter(
    (change) => (change.anterior ?? "") !== (change.novo ?? ""),
  );
  if (!relevant.length) return;

  const db = params.tx ?? prisma;
  await db.movimentacao.createMany({
    data: relevant.map((change) => ({
      kind: params.kind,
      computadorId: params.computadorId ?? null,
      monitorId: params.monitorId ?? null,
      actorId: params.actorId ?? null,
      campo: change.campo,
      valorAnterior: change.anterior ?? null,
      valorNovo: change.novo ?? null,
    })),
  });
}

/** Replica no monitor o histórico de alocação herdado do PC: status, setor, prédio e usuário. */
export async function logLinkedMonitorChanges(params: {
  tx: Prisma.TransactionClient;
  computadorId: string;
  actorId?: string | null;
  changes: Change[];
}) {
  const relevant = params.changes.filter(
    (change) => (change.anterior ?? "") !== (change.novo ?? ""),
  );
  if (!relevant.length) return [] as string[];

  const monitors = await params.tx.monitor.findMany({
    where: { computadorId: params.computadorId, deletedAt: null },
    select: { id: true },
  });
  if (!monitors.length) return [];

  await params.tx.movimentacao.createMany({
    data: monitors.flatMap((monitor) =>
      relevant.map((change) => ({
        kind: AssetKind.MONITOR,
        monitorId: monitor.id,
        actorId: params.actorId ?? null,
        campo: change.campo,
        valorAnterior: change.anterior ?? null,
        valorNovo: change.novo ?? null,
      })),
    ),
  });
  return monitors.map((monitor) => monitor.id);
}

export const FIELD_LABELS: Record<string, string> = {
  status: "Status",
  departamento: "Setor",
  localizacao: "Prédio",
  usuario: "Usuário",
  computador: "Computador associado",
  tombo: "Patrimônio",
  created: "Cadastro",
  lote: "Cadastro em lote",
  deleted: "Exclusão",
};
