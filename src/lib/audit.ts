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

export const FIELD_LABELS: Record<string, string> = {
  status: "Status",
  departamento: "Setor",
  localizacao: "Prédio",
  usuario: "Usuário",
  computador: "Computador associado",
  grupo: "Agrupamento",
  tombo: "Patrimônio",
  created: "Cadastro",
  lote: "Cadastro em lote",
  deleted: "Exclusão",
};
