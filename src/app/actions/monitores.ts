"use server";

import { AssetKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { logChanges } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { emptyToNull } from "@/lib/utils";
import { formatPredio } from "@/lib/predios";

const schema = z.object({
  id: z.string().optional(),
  tombo: z.string().min(1, "Patrimônio é obrigatório").max(50),
  serialNumber: z.string().max(80).nullable(),
  fabricante: z.string().max(80).nullable(),
  modelo: z.string().max(120).nullable(),
  tamanho: z.string().max(40).nullable(),
  resolucao: z.string().max(40).nullable(),
  conexoes: z.string().max(80).nullable(),
  status: z.enum([
    "IN_USE",
    "AVAILABLE",
    "RESERVE",
    "MAINTENANCE",
    "AWAITING_INSTALL",
    "DISPOSED",
    "INACTIVE",
  ]),
  observacoes: z.string().max(1000).nullable(),
  usuario: z.string().max(150).nullable(),
  servidorId: z.string().nullable(),
  departamentoId: z.string().nullable(),
  localizacaoId: z.string().nullable(),
  computadorId: z.string().nullable(),
});

function fromForm(formData: FormData) {
  return schema.safeParse({
    id: emptyToNull(formData.get("id")) ?? undefined,
    tombo: String(formData.get("tombo") ?? "").trim(),
    serialNumber: emptyToNull(formData.get("serialNumber")),
    fabricante: emptyToNull(formData.get("fabricante")),
    modelo: emptyToNull(formData.get("modelo")),
    tamanho: emptyToNull(formData.get("tamanho")),
    resolucao: emptyToNull(formData.get("resolucao")),
    conexoes: emptyToNull(formData.get("conexoes")),
    status: formData.get("status") || "AVAILABLE",
    observacoes: emptyToNull(formData.get("observacoes")),
    usuario: emptyToNull(formData.get("usuario")),
    servidorId: emptyToNull(formData.get("servidorId")),
    departamentoId: emptyToNull(formData.get("departamentoId")),
    localizacaoId: emptyToNull(formData.get("localizacaoId")),
    computadorId: emptyToNull(formData.get("computadorId")),
  });
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/computadores");
  revalidatePath("/monitores");
  revalidatePath("/movimentacoes");
  revalidatePath("/relatorios");
}

export async function saveMonitor(_: unknown, formData: FormData) {
  const session = await requireAdmin();
  const parsed = fromForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    const servidor = data.servidorId
      ? await prisma.servidor.findUnique({ where: { id: data.servidorId } })
      : null;
    const usuario = servidor?.nome ?? data.usuario;
    const departamentoId = servidor?.departamentoId ?? data.departamentoId;

    if (data.id) {
      const current = await prisma.monitor.findUnique({
        where: { id: data.id },
        include: { departamento: true, localizacao: true, computador: true },
      });
      if (!current) return { error: "Monitor não encontrado." };
      const nextDept = departamentoId
        ? await prisma.departamento.findUnique({ where: { id: departamentoId } })
        : null;
      const nextLoc = data.localizacaoId
        ? await prisma.localizacao.findUnique({ where: { id: data.localizacaoId } })
        : null;
      const nextPc = data.computadorId
        ? await prisma.computador.findUnique({ where: { id: data.computadorId } })
        : null;

      await prisma.$transaction(async (tx) => {
        await tx.monitor.update({
          where: { id: data.id },
          data: {
            tombo: data.tombo,
            serialNumber: data.serialNumber,
            fabricante: data.fabricante,
            modelo: data.modelo,
            tamanho: data.tamanho,
            resolucao: data.resolucao,
            conexoes: data.conexoes,
            status: data.status,
            observacoes: data.observacoes,
            usuario,
            servidorId: data.servidorId,
            departamentoId,
            localizacaoId: data.localizacaoId,
            computadorId: data.computadorId,
          },
        });
        await logChanges({
          tx,
          kind: AssetKind.MONITOR,
          monitorId: data.id,
          actorId: session.user.id,
          changes: [
            { campo: "status", anterior: current.status, novo: data.status },
            { campo: "departamento", anterior: current.departamento?.nome, novo: nextDept?.nome },
            { campo: "localizacao", anterior: formatPredio(current.localizacao), novo: formatPredio(nextLoc) },
            { campo: "usuario", anterior: current.usuario, novo: usuario },
            { campo: "computador", anterior: current.computador?.tombo, novo: nextPc?.tombo },
            { campo: "tombo", anterior: current.tombo, novo: data.tombo },
          ],
        });
      });
    } else {
      const created = await prisma.monitor.create({
        data: {
          tombo: data.tombo,
          serialNumber: data.serialNumber,
          fabricante: data.fabricante,
          modelo: data.modelo,
          tamanho: data.tamanho,
          resolucao: data.resolucao,
          conexoes: data.conexoes,
          status: data.status,
          observacoes: data.observacoes,
          usuario,
          servidorId: data.servidorId,
          departamentoId,
          localizacaoId: data.localizacaoId,
          computadorId: data.computadorId,
        },
      });
      await logChanges({
        kind: AssetKind.MONITOR,
        monitorId: created.id,
        actorId: session.user.id,
        changes: [{ campo: "created", novo: created.tombo }],
      });
    }
    refresh();
    return { success: true };
  } catch {
    return { error: "Não foi possível salvar. Verifique patrimônio e serial duplicados." };
  }
}

export async function deleteMonitor(id: string) {
  const session = await requireAdmin();
  const current = await prisma.monitor.findUnique({ where: { id } });
  if (!current) return { error: "Monitor não encontrado." };
  await prisma.monitor.update({ where: { id }, data: { deletedAt: new Date(), status: "INACTIVE", computadorId: null } });
  await logChanges({
    kind: AssetKind.MONITOR,
    monitorId: id,
    actorId: session.user.id,
    changes: [{ campo: "deleted", anterior: current.tombo, novo: "inativo" }],
  });
  refresh();
  return { success: true };
}
