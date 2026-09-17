import { describe, expect, it } from "vitest";
import {
  agrupar,
  allocationsEqual,
  createMemoryStore,
  detachOnDelete,
  planGroupMigration,
  removeAssetFromGroup,
  syncGroupAllocation,
  transferAssetBetweenGroups,
  ungroupAll,
  type GroupMember,
} from "@/lib/equipamento-grupo";
import type { AssetStatus } from "@prisma/client";

function asset(partial: Partial<GroupMember> & Pick<GroupMember, "kind" | "id" | "tombo">): GroupMember {
  return {
    usuario: null,
    servidorId: null,
    departamentoId: null,
    localizacaoId: null,
    status: "RESERVE" as AssetStatus,
    groupId: null,
    deletedAt: null,
    ...partial,
  };
}

function storeWith(rows: GroupMember[]) {
  return createMemoryStore(rows);
}

describe("agrupamento de equipamentos", () => {
  it("1. agrupa PC + 1 monitor", async () => {
    const store = storeWith([
      asset({ kind: "COMPUTER", id: "pc1", tombo: "016001", usuario: "João", status: "IN_USE", departamentoId: "d1", localizacaoId: "l1" }),
      asset({ kind: "MONITOR", id: "m1", tombo: "017058" }),
    ]);
    const members = await agrupar(store, { reference: { kind: "COMPUTER", id: "pc1" }, others: [{ kind: "MONITOR", id: "m1" }] });
    expect(members).toHaveLength(2);
    expect(new Set(members.map((item) => item.groupId)).size).toBe(1);
    expect(store.all().find((item) => item.id === "m1")?.usuario).toBe("João");
    expect(store.all().find((item) => item.id === "m1")?.status).toBe("IN_USE");
  });

  it("2. agrupa PC + 2 monitores", async () => {
    const store = storeWith([
      asset({ kind: "COMPUTER", id: "pc1", tombo: "016001", usuario: "João", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m1", tombo: "017058" }),
      asset({ kind: "MONITOR", id: "m2", tombo: "017059" }),
    ]);
    const members = await agrupar(store, {
      reference: { kind: "COMPUTER", id: "pc1" },
      others: [{ kind: "MONITOR", id: "m1" }, { kind: "MONITOR", id: "m2" }],
    });
    expect(members).toHaveLength(3);
    expect(store.all().every((item) => item.usuario === "João")).toBe(true);
  });

  it("3. agrupa 2 monitores sem PC", async () => {
    const store = storeWith([
      asset({ kind: "MONITOR", id: "m1", tombo: "017058", usuario: "Ana", departamentoId: "d1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m2", tombo: "017059" }),
    ]);
    const members = await agrupar(store, { reference: { kind: "MONITOR", id: "m1" }, others: [{ kind: "MONITOR", id: "m2" }] });
    expect(members).toHaveLength(2);
    expect(members.every((item) => item.kind === "MONITOR")).toBe(true);
    expect(store.all().find((item) => item.id === "m2")?.usuario).toBe("Ana");
  });

  it("4. adiciona monitor a grupo existente", async () => {
    const store = storeWith([
      asset({ kind: "COMPUTER", id: "pc1", tombo: "016001", usuario: "João", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m1", tombo: "017058", usuario: "João", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m2", tombo: "017059" }),
    ]);
    await agrupar(store, { reference: { kind: "COMPUTER", id: "pc1" }, others: [{ kind: "MONITOR", id: "m2" }] });
    const grouped = store.all().filter((item) => item.groupId === "g1");
    expect(grouped).toHaveLength(3);
    expect(store.all().find((item) => item.id === "m2")?.usuario).toBe("João");
  });

  it("5. altera usuário e sincroniza o grupo", async () => {
    const store = storeWith([
      asset({ kind: "COMPUTER", id: "pc1", tombo: "016001", usuario: "João", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m1", tombo: "017058", usuario: "João", groupId: "g1", status: "IN_USE" }),
    ]);
    await store.save(store.all().find((item) => item.id === "pc1")!, { usuario: "Paula" });
    await syncGroupAllocation(store, {
      originator: { kind: "COMPUTER", id: "pc1" },
      next: { usuario: "Paula", servidorId: null, departamentoId: null, localizacaoId: null, status: "IN_USE" },
      labels: {
        anterior: { usuario: "João", departamento: null, localizacao: null, status: "Em uso" },
        novo: { usuario: "Paula", departamento: null, localizacao: null, status: "Em uso" },
      },
    });
    expect(store.all().every((item) => item.usuario === "Paula")).toBe(true);
    expect(store.logs.some((item) => item.changes.some((change) => change.campo === "grupo" && change.novo === "Sincronizada"))).toBe(true);
  });

  it("6. altera setor e sincroniza o grupo", async () => {
    const store = storeWith([
      asset({ kind: "COMPUTER", id: "pc1", tombo: "016001", departamentoId: "d1", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m1", tombo: "017058", departamentoId: "d1", groupId: "g1", status: "IN_USE" }),
    ]);
    const pc = (await store.get({ kind: "COMPUTER", id: "pc1" }))!;
    await store.save(pc, { departamentoId: "d2" });
    await syncGroupAllocation(store, {
      originator: { kind: "COMPUTER", id: "pc1" },
      next: { usuario: null, servidorId: null, departamentoId: "d2", localizacaoId: null, status: "IN_USE" },
      labels: {
        anterior: { usuario: null, departamento: "CAU", localizacao: null, status: "Em uso" },
        novo: { usuario: null, departamento: "Gabinete", localizacao: null, status: "Em uso" },
      },
    });
    expect(store.all().every((item) => item.departamentoId === "d2")).toBe(true);
  });

  it("7. altera localização e sincroniza o grupo", async () => {
    const store = storeWith([
      asset({ kind: "COMPUTER", id: "pc1", tombo: "016001", localizacaoId: "l1", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m1", tombo: "017058", localizacaoId: "l1", groupId: "g1", status: "IN_USE" }),
    ]);
    const monitor = (await store.get({ kind: "MONITOR", id: "m1" }))!;
    await store.save(monitor, { localizacaoId: "l2" });
    await syncGroupAllocation(store, {
      originator: { kind: "MONITOR", id: "m1" },
      next: { usuario: null, servidorId: null, departamentoId: null, localizacaoId: "l2", status: "IN_USE" },
      labels: {
        anterior: { usuario: null, departamento: null, localizacao: "Sede", status: "Em uso" },
        novo: { usuario: null, departamento: null, localizacao: "Anexo", status: "Em uso" },
      },
    });
    expect(store.all().every((item) => item.localizacaoId === "l2")).toBe(true);
  });

  it("8. altera status e sincroniza o grupo", async () => {
    const store = storeWith([
      asset({ kind: "COMPUTER", id: "pc1", tombo: "016001", status: "RESERVE", groupId: "g1" }),
      asset({ kind: "MONITOR", id: "m1", tombo: "017058", status: "RESERVE", groupId: "g1" }),
    ]);
    const pc = (await store.get({ kind: "COMPUTER", id: "pc1" }))!;
    await store.save(pc, { status: "IN_USE" });
    await syncGroupAllocation(store, {
      originator: { kind: "COMPUTER", id: "pc1" },
      next: { usuario: null, servidorId: null, departamentoId: null, localizacaoId: null, status: "IN_USE" },
      labels: {
        anterior: { usuario: null, departamento: null, localizacao: null, status: "Reserva" },
        novo: { usuario: null, departamento: null, localizacao: null, status: "Em uso" },
      },
    });
    expect(store.all().every((item) => item.status === "IN_USE")).toBe(true);
  });

  it("9. retira um monitor de PC + 2 monitores", async () => {
    const store = storeWith([
      asset({ kind: "COMPUTER", id: "pc1", tombo: "016001", usuario: "João", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m1", tombo: "017058", usuario: "João", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m2", tombo: "017059", usuario: "João", groupId: "g1", status: "IN_USE" }),
    ]);
    const kept = await removeAssetFromGroup(store, { asset: { kind: "MONITOR", id: "m2" } });
    expect(kept.usuario).toBe("João");
    expect(store.all().find((item) => item.id === "m2")?.groupId).toBeNull();
    expect(store.all().filter((item) => item.groupId === "g1")).toHaveLength(2);
  });

  it("10. retira o PC e mantém os dois monitores agrupados", async () => {
    const store = storeWith([
      asset({ kind: "COMPUTER", id: "pc1", tombo: "016001", usuario: "João", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m1", tombo: "017058", usuario: "João", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m2", tombo: "017059", usuario: "João", groupId: "g1", status: "IN_USE" }),
    ]);
    await removeAssetFromGroup(store, { asset: { kind: "COMPUTER", id: "pc1" } });
    const pc = store.all().find((item) => item.id === "pc1")!;
    const monitors = store.all().filter((item) => item.kind === "MONITOR");
    expect(pc.groupId).toBeNull();
    expect(pc.usuario).toBe("João");
    expect(monitors.every((item) => item.groupId === "g1")).toBe(true);
    expect(monitors.every((item) => item.usuario === "João")).toBe(true);
  });

  it("11. desagrupa tudo sem limpar alocação", async () => {
    const store = storeWith([
      asset({ kind: "COMPUTER", id: "pc1", tombo: "016001", usuario: "João", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m1", tombo: "017058", usuario: "João", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m2", tombo: "017059", usuario: "João", groupId: "g1", status: "IN_USE" }),
    ]);
    await ungroupAll(store, { asset: { kind: "COMPUTER", id: "pc1" } });
    expect(store.all().every((item) => item.groupId === null)).toBe(true);
    expect(store.all().every((item) => item.usuario === "João" && item.status === "IN_USE")).toBe(true);
  });

  it("12. retira integrante e encerra grupo com um restante", async () => {
    const store = storeWith([
      asset({ kind: "COMPUTER", id: "pc1", tombo: "016001", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m1", tombo: "017058", groupId: "g1", status: "IN_USE" }),
    ]);
    await removeAssetFromGroup(store, { asset: { kind: "MONITOR", id: "m1" } });
    expect(store.all().every((item) => item.groupId === null)).toBe(true);
    expect(store.all().find((item) => item.id === "pc1")?.status).toBe("IN_USE");
  });

  it("13. transfere equipamento entre grupos", async () => {
    const store = storeWith([
      asset({ kind: "COMPUTER", id: "pc1", tombo: "016001", usuario: "João", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m1", tombo: "017058", usuario: "João", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m2", tombo: "017059", usuario: "João", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "COMPUTER", id: "pc2", tombo: "016002", usuario: "Paula", groupId: "g2", status: "RESERVE" }),
      asset({ kind: "MONITOR", id: "m3", tombo: "017060", usuario: "Paula", groupId: "g2", status: "RESERVE" }),
    ]);
    await transferAssetBetweenGroups(store, {
      asset: { kind: "MONITOR", id: "m2" },
      destination: { kind: "COMPUTER", id: "pc2" },
    });
    const moved = store.all().find((item) => item.id === "m2")!;
    expect(moved.groupId).toBe("g2");
    expect(moved.usuario).toBe("Paula");
    expect(store.all().filter((item) => item.groupId === "g1")).toHaveLength(2);
    expect(store.all().filter((item) => item.groupId === "g2")).toHaveLength(3);
  });

  it("14. excluir/inativar integrante não altera os demais", async () => {
    const store = storeWith([
      asset({ kind: "COMPUTER", id: "pc1", tombo: "016001", usuario: "João", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m1", tombo: "017058", usuario: "João", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m2", tombo: "017059", usuario: "João", groupId: "g1", status: "IN_USE" }),
    ]);
    await detachOnDelete(store, { kind: "MONITOR", id: "m1" });
    const remaining = store.all().filter((item) => item.id !== "m1");
    expect(store.all().find((item) => item.id === "m1")?.groupId).toBeNull();
    expect(remaining.filter((item) => item.groupId === "g1")).toHaveLength(2);
    expect(remaining.every((item) => item.usuario === "João" && item.status === "IN_USE")).toBe(true);
  });

  it("15. equipamento desagrupado preserva a última alocação", async () => {
    const store = storeWith([
      asset({ kind: "COMPUTER", id: "pc1", tombo: "016001", usuario: "João", departamentoId: "d1", localizacaoId: "l1", groupId: "g1", status: "IN_USE" }),
      asset({ kind: "MONITOR", id: "m1", tombo: "017058", usuario: "João", departamentoId: "d1", localizacaoId: "l1", groupId: "g1", status: "IN_USE" }),
    ]);
    const kept = await removeAssetFromGroup(store, { asset: { kind: "MONITOR", id: "m1" } });
    expect(allocationsEqual(kept, {
      usuario: "João",
      servidorId: null,
      departamentoId: "d1",
      localizacaoId: "l1",
      status: "IN_USE",
    })).toBe(true);
  });

  it("16. migração dos vínculos computadorId existentes", () => {
    const groups = planGroupMigration(
      [
        { computerId: "pc1", computerActive: true, monitorIds: ["m1", "m2"] },
        { computerId: "pc2", computerActive: true, monitorIds: ["m3"] },
        { computerId: "pc3", computerActive: false, monitorIds: ["m4"] },
        { computerId: "pc4", computerActive: false, monitorIds: ["m5", "m6"] },
        { computerId: "pc5", computerActive: true, monitorIds: [] },
      ],
      () => "gid",
    );
    expect(groups).toEqual([
      { groupId: "gid", computerId: "pc1", monitorIds: ["m1", "m2"] },
      { groupId: "gid", computerId: "pc2", monitorIds: ["m3"] },
      { groupId: "gid", computerId: null, monitorIds: ["m5", "m6"] },
    ]);
  });

  it("17. rollback da transação em caso de erro", async () => {
    const seed = [
      asset({ kind: "COMPUTER", id: "pc1", tombo: "016001", usuario: "João" }),
      asset({ kind: "MONITOR", id: "m1", tombo: "017058" }),
    ];
    const store = storeWith(seed);
    store.failNextSaves(1);
    await expect(
      store.run(() => agrupar(store, { reference: { kind: "COMPUTER", id: "pc1" }, others: [{ kind: "MONITOR", id: "m1" }] })),
    ).rejects.toThrow("Falha simulada na transação.");
    expect(store.all().every((item) => item.groupId === null)).toBe(true);
    expect(store.all().find((item) => item.id === "m1")?.usuario).toBeNull();
  });
});
