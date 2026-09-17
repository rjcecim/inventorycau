import { AssetKind, AssetStatus, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { logChanges } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { formatPredio } from "@/lib/predios";
import { statusLabel } from "@/lib/status";

export type AssetRef = { kind: "COMPUTER" | "MONITOR"; id: string };

export type Allocation = {
  usuario: string | null;
  servidorId: string | null;
  departamentoId: string | null;
  localizacaoId: string | null;
  status: AssetStatus;
};

export type GroupMember = AssetRef & {
  tombo: string;
  groupId: string | null;
  deletedAt: Date | null;
} & Allocation;

export type AllocationLabels = {
  usuario: string | null;
  departamento: string | null;
  localizacao: string | null;
  status: string;
};

export type GroupLog = {
  campo: string;
  anterior?: string | null;
  novo?: string | null;
};

export type GroupStore = {
  get(ref: AssetRef): Promise<GroupMember | null>;
  listGroup(groupId: string): Promise<GroupMember[]>;
  lock(refs: AssetRef[], groupIds: string[]): Promise<void>;
  save(member: GroupMember, data: { groupId?: string | null } & Partial<Allocation>): Promise<void>;
  log(member: GroupMember, changes: GroupLog[], actorId?: string | null): Promise<void>;
};

export function newGroupId() {
  return randomUUID();
}

export function memberLabel(member: Pick<GroupMember, "kind" | "tombo">) {
  return member.kind === "COMPUTER" ? `Computador ${member.tombo}` : `Monitor ${member.tombo}`;
}

export function memberHref(member: AssetRef) {
  return member.kind === "COMPUTER" ? `/computadores/${member.id}` : `/monitores/${member.id}`;
}

export function sortMembers<T extends Pick<GroupMember, "kind" | "tombo">>(members: T[]) {
  return [...members].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "COMPUTER" ? -1 : 1;
    return a.tombo.localeCompare(b.tombo, "pt-BR", { numeric: true });
  });
}

export function formatMemberList(members: Pick<GroupMember, "kind" | "tombo">[]) {
  return sortMembers(members).map(memberLabel).join(", ");
}

export function allocationsEqual(a: Allocation, b: Allocation) {
  return (
    (a.usuario ?? "") === (b.usuario ?? "") &&
    (a.servidorId ?? "") === (b.servidorId ?? "") &&
    (a.departamentoId ?? "") === (b.departamentoId ?? "") &&
    (a.localizacaoId ?? "") === (b.localizacaoId ?? "") &&
    a.status === b.status
  );
}

export function allocationSnapshot(member: Allocation): Allocation {
  return {
    usuario: member.usuario,
    servidorId: member.servidorId,
    departamentoId: member.departamentoId,
    localizacaoId: member.localizacaoId,
    status: member.status,
  };
}

export type MigrationLink = {
  computerId: string;
  computerActive: boolean;
  monitorIds: string[];
};

export type MigrationGroup = {
  groupId: string;
  computerId: string | null;
  monitorIds: string[];
};

/** Converte vínculos Monitor→PC em grupos horizontais, sem criar grupo de um integrante. */
export function planGroupMigration(links: MigrationLink[], nextId: () => string = newGroupId): MigrationGroup[] {
  const groups: MigrationGroup[] = [];
  for (const link of links) {
    const monitorIds = [...new Set(link.monitorIds)];
    const computerId = link.computerActive ? link.computerId : null;
    const count = (computerId ? 1 : 0) + monitorIds.length;
    if (count < 2) continue;
    groups.push({ groupId: nextId(), computerId, monitorIds });
  }
  return groups;
}

function sameRef(a: AssetRef, b: AssetRef) {
  return a.kind === b.kind && a.id === b.id;
}

function sqlIdList(ids: string[]) {
  return Prisma.join(ids.map((id) => Prisma.sql`${id}`));
}

function allocationFieldChanges(anterior: AllocationLabels, novo: AllocationLabels): GroupLog[] {
  return [
    { campo: "status", anterior: anterior.status, novo: novo.status },
    { campo: "departamento", anterior: anterior.departamento, novo: novo.departamento },
    { campo: "localizacao", anterior: anterior.localizacao, novo: novo.localizacao },
    { campo: "usuario", anterior: anterior.usuario, novo: novo.usuario },
  ].filter((change) => (change.anterior ?? "") !== (change.novo ?? ""));
}

async function loadRequired(store: GroupStore, ref: AssetRef) {
  const member = await store.get(ref);
  if (!member || member.deletedAt) {
    throw new Error(`${ref.kind === "COMPUTER" ? "Computador" : "Monitor"} não encontrado.`);
  }
  return member;
}

async function lockAround(store: GroupStore, refs: AssetRef[]) {
  const members = await Promise.all(refs.map((ref) => store.get(ref)));
  const groupIds = [...new Set(members.map((item) => item?.groupId).filter((id): id is string => Boolean(id)))];
  await store.lock(refs, groupIds);
}

export async function normalizeGroup(store: GroupStore, groupId: string | null, actorId?: string | null) {
  if (!groupId) return;
  const members = await store.listGroup(groupId);
  if (members.length >= 2) return;
  const remaining = members[0];
  if (!remaining) return;
  const before = formatMemberList(members);
  await store.save(remaining, { groupId: null });
  await store.log(
    remaining,
    [{ campo: "grupo", anterior: before, novo: "Sem agrupamento" }],
    actorId,
  );
}

export async function syncGroupAllocation(
  store: GroupStore,
  params: {
    originator: AssetRef;
    next: Allocation;
    labels: { anterior: AllocationLabels; novo: AllocationLabels };
    actorId?: string | null;
  },
) {
  const originator = await loadRequired(store, params.originator);
  if (!originator.groupId) return [] as GroupMember[];

  await store.lock([params.originator], [originator.groupId]);
  const members = await store.listGroup(originator.groupId);
  const others = members.filter((item) => !sameRef(item, originator));
  const fieldChanges = allocationFieldChanges(params.labels.anterior, params.labels.novo);
  const changes: GroupLog[] = fieldChanges.length
    ? [...fieldChanges, { campo: "grupo", anterior: "Alocação compartilhada", novo: "Sincronizada" }]
    : [];

  for (const member of others) {
    if (allocationsEqual(member, params.next)) continue;
    await store.save(member, params.next);
    if (changes.length) await store.log(member, changes, params.actorId);
  }
  return others;
}

export async function agrupar(
  store: GroupStore,
  params: {
    reference: AssetRef;
    others: AssetRef[];
    actorId?: string | null;
  },
) {
  const uniqueOthers = params.others.filter((item) => !sameRef(item, params.reference));
  if (!uniqueOthers.length) throw new Error("Selecione pelo menos um equipamento além da referência.");

  const refs = [params.reference, ...uniqueOthers];
  await lockAround(store, refs);

  const reference = await loadRequired(store, params.reference);
  const others: GroupMember[] = [];
  for (const ref of uniqueOthers) others.push(await loadRequired(store, ref));

  const wasNewGroup = !reference.groupId;
  const groupId = reference.groupId ?? newGroupId();
  const alloc = allocationSnapshot(reference);
  const previousGroups = [...new Set(
    others.map((item) => item.groupId).filter((id): id is string => Boolean(id) && id !== groupId),
  )];
  const oldMembers = new Map<string, GroupMember[]>();
  for (const oldId of previousGroups) {
    oldMembers.set(oldId, await store.listGroup(oldId));
  }

  if (wasNewGroup) await store.save(reference, { groupId });
  for (const member of others) {
    await store.save(member, { ...alloc, groupId });
  }

  for (const oldId of previousGroups) {
    const leftover = await store.listGroup(oldId);
    const anterior = formatMemberList(oldMembers.get(oldId) ?? []);
    if (leftover.length >= 2) {
      for (const item of leftover) {
        await store.log(item, [{ campo: "grupo", anterior, novo: formatMemberList(leftover) }], params.actorId);
      }
    } else {
      await normalizeGroup(store, oldId, params.actorId);
    }
  }

  const members = sortMembers(await store.listGroup(groupId));
  if (members.length < 2) throw new Error("O agrupamento precisa de pelo menos dois equipamentos.");

  const list = formatMemberList(members);
  const newcomers = others.filter((item) => item.groupId !== groupId);
  const previousMembers = members.filter((item) => !newcomers.some((other) => sameRef(other, item)));
  const previousLabel = wasNewGroup ? "Sem agrupamento" : formatMemberList(previousMembers);

  for (const member of members) {
    const newcomer = newcomers.find((item) => sameRef(item, member));
    let anterior = previousLabel;
    if (newcomer) {
      const oldId = newcomer.groupId;
      anterior = oldId
        ? `Transferido (${formatMemberList(oldMembers.get(oldId) ?? [newcomer])})`
        : "Sem agrupamento";
    } else if (sameRef(member, reference) && wasNewGroup) {
      anterior = "Sem agrupamento";
    }
    await store.log(member, [{ campo: "grupo", anterior, novo: list }], params.actorId);
  }

  for (const member of others) {
    if (allocationsEqual(member, alloc)) continue;
    await store.log(
      member,
      [
        { campo: "status", anterior: member.status, novo: alloc.status },
        { campo: "usuario", anterior: member.usuario, novo: alloc.usuario },
        { campo: "grupo", anterior: "Alocação", novo: `Copiada de ${memberLabel(reference)}` },
      ],
      params.actorId,
    );
  }

  return members;
}

export async function addAssetToGroup(
  store: GroupStore,
  params: { asset: AssetRef; groupId: string; actorId?: string | null },
) {
  const seed = (await store.listGroup(params.groupId))[0];
  if (!seed) throw new Error("Agrupamento não encontrado.");
  return agrupar(store, { reference: seed, others: [params.asset], actorId: params.actorId });
}

export async function removeAssetFromGroup(
  store: GroupStore,
  params: { asset: AssetRef; actorId?: string | null },
) {
  await lockAround(store, [params.asset]);
  const member = await loadRequired(store, params.asset);
  if (!member.groupId) throw new Error("Este equipamento não está agrupado.");

  const groupId = member.groupId;
  const before = await store.listGroup(groupId);
  const beforeLabel = formatMemberList(before);

  await store.save(member, { groupId: null });
  await store.log(member, [{ campo: "grupo", anterior: beforeLabel, novo: "Sem agrupamento" }], params.actorId);

  const remaining = before.filter((item) => !sameRef(item, member));
  if (remaining.length >= 2) {
    const afterLabel = formatMemberList(remaining);
    for (const item of remaining) {
      await store.log(item, [{ campo: "grupo", anterior: beforeLabel, novo: afterLabel }], params.actorId);
    }
  } else {
    await normalizeGroup(store, groupId, params.actorId);
  }
  return allocationSnapshot(member);
}

export async function ungroupAll(
  store: GroupStore,
  params: { asset: AssetRef; actorId?: string | null },
) {
  await lockAround(store, [params.asset]);
  const member = await loadRequired(store, params.asset);
  if (!member.groupId) throw new Error("Este equipamento não está agrupado.");

  const members = await store.listGroup(member.groupId);
  const beforeLabel = formatMemberList(members);
  for (const item of members) {
    await store.save(item, { groupId: null });
    await store.log(item, [{ campo: "grupo", anterior: beforeLabel, novo: "Sem agrupamento" }], params.actorId);
  }
  return members.map(allocationSnapshot);
}

export async function detachOnDelete(store: GroupStore, asset: AssetRef, actorId?: string | null) {
  const member = await store.get(asset);
  if (!member?.groupId) return;
  const groupId = member.groupId;
  const before = await store.listGroup(groupId);
  const beforeLabel = formatMemberList(before);
  await store.save(member, { groupId: null });
  const remaining = before.filter((item) => !sameRef(item, member));
  if (remaining.length >= 2) {
    const afterLabel = formatMemberList(remaining);
    for (const item of remaining) {
      await store.log(item, [{ campo: "grupo", anterior: beforeLabel, novo: afterLabel }], actorId);
    }
  } else {
    await normalizeGroup(store, groupId, actorId);
  }
}

export async function transferAssetBetweenGroups(
  store: GroupStore,
  params: { asset: AssetRef; destination: AssetRef; actorId?: string | null },
) {
  return agrupar(store, { reference: params.destination, others: [params.asset], actorId: params.actorId });
}

export function createMemoryStore(seed: GroupMember[] = []) {
  const rows = new Map<string, GroupMember>(seed.map((item) => [`${item.kind}:${item.id}`, { ...item }]));
  const logs: Array<{ member: string; changes: GroupLog[]; actorId?: string | null }> = [];
  let failOnSave = 0;

  const store: GroupStore & {
    all(): GroupMember[];
    logs: typeof logs;
    failNextSaves(count: number): void;
    run<T>(fn: () => Promise<T>): Promise<T>;
  } = {
    logs,
    all: () => [...rows.values()].map((item) => ({ ...item })),
    failNextSaves(count: number) {
      failOnSave = count;
    },
    async run(fn) {
      const backup = [...rows.entries()].map(([key, value]) => [key, { ...value }] as const);
      const logBackup = logs.map((item) => ({ ...item, changes: [...item.changes] }));
      try {
        return await fn();
      } catch (error) {
        rows.clear();
        for (const [key, value] of backup) rows.set(key, value);
        logs.length = 0;
        logs.push(...logBackup);
        throw error;
      }
    },
    async get(ref) {
      const row = rows.get(`${ref.kind}:${ref.id}`);
      return row ? { ...row } : null;
    },
    async listGroup(groupId) {
      return [...rows.values()].filter((item) => item.groupId === groupId && !item.deletedAt).map((item) => ({ ...item }));
    },
    async lock() {},
    async save(member, data) {
      if (failOnSave > 0) {
        failOnSave -= 1;
        throw new Error("Falha simulada na transação.");
      }
      const key = `${member.kind}:${member.id}`;
      const current = rows.get(key);
      if (!current) throw new Error("Equipamento não encontrado.");
      rows.set(key, { ...current, ...data });
    },
    async log(member, changes, actorId) {
      logs.push({ member: `${member.kind}:${member.id}`, changes, actorId });
    },
  };
  return store;
}

function toMember(
  kind: "COMPUTER" | "MONITOR",
  row: {
    id: string;
    tombo: string;
    groupId: string | null;
    deletedAt: Date | null;
    usuario: string | null;
    servidorId: string | null;
    departamentoId: string | null;
    localizacaoId: string | null;
    status: AssetStatus;
  },
): GroupMember {
  return {
    kind,
    id: row.id,
    tombo: row.tombo,
    groupId: row.groupId,
    deletedAt: row.deletedAt,
    usuario: row.usuario,
    servidorId: row.servidorId,
    departamentoId: row.departamentoId,
    localizacaoId: row.localizacaoId,
    status: row.status,
  };
}

export function prismaGroupStore(tx: Prisma.TransactionClient): GroupStore {
  return {
    async get(ref) {
      if (ref.kind === "COMPUTER") {
        const row = await tx.computador.findUnique({ where: { id: ref.id } });
        return row ? toMember("COMPUTER", row) : null;
      }
      const row = await tx.monitor.findUnique({ where: { id: ref.id } });
      return row ? toMember("MONITOR", row) : null;
    },
    async listGroup(groupId) {
      const [computers, monitors] = await Promise.all([
        tx.computador.findMany({ where: { groupId, deletedAt: null } }),
        tx.monitor.findMany({ where: { groupId, deletedAt: null } }),
      ]);
      return [
        ...computers.map((row) => toMember("COMPUTER", row)),
        ...monitors.map((row) => toMember("MONITOR", row)),
      ];
    },
    async lock(refs, groupIds) {
      const computerIds = refs.filter((item) => item.kind === "COMPUTER").map((item) => item.id);
      const monitorIds = refs.filter((item) => item.kind === "MONITOR").map((item) => item.id);
      if (computerIds.length) {
        await tx.$queryRaw`SELECT id FROM computadores WHERE id IN (${sqlIdList(computerIds)}) FOR UPDATE`;
      }
      if (monitorIds.length) {
        await tx.$queryRaw`SELECT id FROM monitores WHERE id IN (${sqlIdList(monitorIds)}) FOR UPDATE`;
      }
      if (groupIds.length) {
        await tx.$queryRaw`SELECT id FROM computadores WHERE group_id IN (${sqlIdList(groupIds)}) AND deleted_at IS NULL FOR UPDATE`;
        await tx.$queryRaw`SELECT id FROM monitores WHERE group_id IN (${sqlIdList(groupIds)}) AND deleted_at IS NULL FOR UPDATE`;
      }
    },
    async save(member, data) {
      if (member.kind === "COMPUTER") {
        await tx.computador.update({ where: { id: member.id }, data });
        return;
      }
      await tx.monitor.update({ where: { id: member.id }, data });
    },
    async log(member, changes, actorId) {
      await logChanges({
        tx,
        kind: member.kind === "COMPUTER" ? AssetKind.COMPUTER : AssetKind.MONITOR,
        computadorId: member.kind === "COMPUTER" ? member.id : null,
        monitorId: member.kind === "MONITOR" ? member.id : null,
        actorId,
        changes,
      });
    },
  };
}

export const GROUP_TX = {
  isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
  maxWait: 5000,
  timeout: 20000,
} as const;

export async function runGroupTransaction<T>(fn: (store: GroupStore, tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async (tx) => fn(prismaGroupStore(tx), tx), GROUP_TX);
}

export async function allocationLabelsFor(
  tx: Prisma.TransactionClient,
  alloc: Allocation,
): Promise<AllocationLabels> {
  const [departamento, localizacao] = await Promise.all([
    alloc.departamentoId ? tx.departamento.findUnique({ where: { id: alloc.departamentoId } }) : null,
    alloc.localizacaoId ? tx.localizacao.findUnique({ where: { id: alloc.localizacaoId } }) : null,
  ]);
  return {
    usuario: alloc.usuario,
    departamento: departamento?.nome ?? null,
    localizacao: formatPredio(localizacao),
    status: statusLabel(alloc.status),
  };
}

export async function syncAllocationFromOriginator(
  tx: Prisma.TransactionClient,
  params: {
    originator: AssetRef;
    previous: AllocationLabels;
    next: Allocation;
    actorId?: string | null;
  },
) {
  const novo = await allocationLabelsFor(tx, params.next);
  return syncGroupAllocation(prismaGroupStore(tx), {
    originator: params.originator,
    next: params.next,
    labels: { anterior: params.previous, novo },
    actorId: params.actorId,
  });
}

export async function listGroupMembers(kind: "COMPUTER" | "MONITOR", id: string) {
  const current = kind === "COMPUTER"
    ? await prisma.computador.findFirst({ where: { id, deletedAt: null }, select: { groupId: true } })
    : await prisma.monitor.findFirst({ where: { id, deletedAt: null }, select: { groupId: true } });
  if (!current?.groupId) return [] as GroupMember[];
  const [computers, monitors] = await Promise.all([
    prisma.computador.findMany({ where: { groupId: current.groupId, deletedAt: null }, orderBy: { tombo: "asc" } }),
    prisma.monitor.findMany({ where: { groupId: current.groupId, deletedAt: null }, orderBy: { tombo: "asc" } }),
  ]);
  return sortMembers([
    ...computers.map((row) => toMember("COMPUTER", row)),
    ...monitors.map((row) => toMember("MONITOR", row)),
  ]);
}

export function toClientGroupMember(member: GroupMember) {
  return {
    kind: member.kind,
    id: member.id,
    tombo: member.tombo,
    groupId: member.groupId,
    usuario: member.usuario,
    servidorId: member.servidorId,
    departamentoId: member.departamentoId,
    localizacaoId: member.localizacaoId,
    status: member.status,
  };
}

export async function listAgrupamentoCandidates() {
  const [computers, monitors] = await Promise.all([
    prisma.computador.findMany({
      where: { deletedAt: null },
      orderBy: { tombo: "asc" },
      select: { id: true, tombo: true, usuario: true, groupId: true },
    }),
    prisma.monitor.findMany({
      where: { deletedAt: null },
      orderBy: { tombo: "asc" },
      select: { id: true, tombo: true, usuario: true, groupId: true },
    }),
  ]);
  return [
    ...computers.map((item) => ({ kind: "COMPUTER" as const, ...item })),
    ...monitors.map((item) => ({ kind: "MONITOR" as const, ...item })),
  ];
}

export async function revalidateGroupMembers(members: Array<AssetRef>) {
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/");
  revalidatePath("/computadores");
  revalidatePath("/monitores");
  revalidatePath("/movimentacoes");
  revalidatePath("/visao-geral");
  revalidatePath("/relatorios");
  for (const member of members) {
    revalidatePath(memberHref(member));
  }
}
