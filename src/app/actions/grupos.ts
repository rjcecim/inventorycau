"use server";

import { z } from "zod";
import { requireOperator } from "@/lib/authz";
import { emptyToNull } from "@/lib/utils";
import {
  agrupar,
  allocationsEqual,
  allocationSnapshot,
  listGroupMembers,
  memberLabel,
  revalidateGroupMembers,
  removeAssetFromGroup,
  runGroupTransaction,
  ungroupAll,
  type AssetRef,
} from "@/lib/equipamento-grupo";

const refSchema = z.object({
  kind: z.enum(["COMPUTER", "MONITOR"]),
  id: z.string().min(1),
});

function parseRef(formData: FormData, prefix = ""): AssetRef | null {
  const parsed = refSchema.safeParse({
    kind: formData.get(prefix ? `${prefix}Kind` : "kind"),
    id: emptyToNull(formData.get(prefix ? `${prefix}Id` : "id")),
  });
  return parsed.success ? parsed.data : null;
}

function parseOthers(formData: FormData): AssetRef[] {
  const raw = String(formData.get("others") ?? "");
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((token) => {
      const [kind, id] = token.split(":");
      const parsed = refSchema.safeParse({ kind, id });
      return parsed.success ? parsed.data : null;
    })
    .filter((item): item is AssetRef => Boolean(item));
}

export async function agruparEquipamentos(_: unknown, formData: FormData) {
  const session = await requireOperator();
  const reference = parseRef(formData, "reference");
  const others = parseOthers(formData);
  if (!reference) return { error: "Informe o equipamento de referência." };
  if (!others.length) return { error: "Selecione pelo menos um equipamento para agrupar." };

  try {
    const members = await runGroupTransaction(async (store) => {
      const refMember = await store.get(reference);
      if (!refMember || refMember.deletedAt) throw new Error("Equipamento de referência não encontrado.");
      const selected = [];
      for (const other of others) {
        const member = await store.get(other);
        if (!member || member.deletedAt) throw new Error("Um dos equipamentos selecionados não foi encontrado.");
        selected.push(member);
      }
      const differs = selected.some((item) => !allocationsEqual(allocationSnapshot(item), allocationSnapshot(refMember)));
      if (differs && formData.get("confirmouAlocacao") !== "1") {
        throw new Error(
          `A alocação dos selecionados será substituída pela de ${memberLabel(refMember)} (usuário, setor, prédio e status). Confirme para continuar.`,
        );
      }
      return agrupar(store, { reference, others, actorId: session.user.id });
    });
    await revalidateGroupMembers(members);
    return { success: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível agrupar os equipamentos." };
  }
}

export async function desagruparEquipamento(_: unknown, formData: FormData) {
  const session = await requireOperator();
  const asset = parseRef(formData);
  if (!asset) return { error: "Equipamento inválido." };
  try {
    const members = await listGroupMembers(asset.kind, asset.id);
    await runGroupTransaction(async (store) => {
      await removeAssetFromGroup(store, { asset, actorId: session.user.id });
    });
    await revalidateGroupMembers([...members, asset]);
    return { success: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível desagrupar o equipamento." };
  }
}

export async function desagruparTudo(_: unknown, formData: FormData) {
  const session = await requireOperator();
  const asset = parseRef(formData);
  if (!asset) return { error: "Equipamento inválido." };
  try {
    const before = await listGroupMembers(asset.kind, asset.id);
    await runGroupTransaction(async (store) => {
      await ungroupAll(store, { asset, actorId: session.user.id });
    });
    await revalidateGroupMembers(before.length ? before : [asset]);
    return { success: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível desagrupar o agrupamento." };
  }
}
