"use server";

import { AssetKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireSession } from "@/lib/authz";
import { logChanges, logLinkedMonitorChanges } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { emptyToNull } from "@/lib/utils";
import { formatPredio } from "@/lib/predios";
import { parseAcquisitionFromForm } from "@/lib/acquisition-form";
import { formatTomboRangeLabel, parseTomboRange } from "@/lib/tombo-range";
import { releaseDeletedTombos, retireAssetKeys } from "@/lib/tombo-reuse";

const statusEnum = z.enum([
  "IN_USE",
  "AVAILABLE",
  "RESERVE",
  "MAINTENANCE",
  "AWAITING_INSTALL",
  "DISPOSED",
  "INACTIVE",
]);

const schema = z.object({
  id: z.string().optional(),
  tombo: z.string().min(1, "Patrimônio é obrigatório").max(50),
  serialNumber: z.string().max(80).nullable(),
  fabricante: z.string().max(80).nullable(),
  modelo: z.string().max(120).nullable(),
  status: statusEnum,
  processador: z.string().max(120).nullable(),
  memoriaRam: z.string().max(80).nullable(),
  armazenamento: z.string().max(80).nullable(),
  observacoes: z.string().max(1000).nullable(),
  servidorId: z.string().nullable(),
  departamentoId: z.string().nullable(),
  localizacaoId: z.string().nullable(),
});

function fromForm(formData: FormData) {
  return schema.safeParse({
    id: emptyToNull(formData.get("id")) ?? undefined,
    tombo: String(formData.get("tombo") ?? "").trim(),
    serialNumber: emptyToNull(formData.get("serialNumber")),
    fabricante: emptyToNull(formData.get("fabricante")),
    modelo: emptyToNull(formData.get("modelo")),
    status: formData.get("status") || "AVAILABLE",
    processador: emptyToNull(formData.get("processador")),
    memoriaRam: emptyToNull(formData.get("memoriaRam")),
    armazenamento: emptyToNull(formData.get("armazenamento")),
    observacoes: emptyToNull(formData.get("observacoes")),
    servidorId: emptyToNull(formData.get("servidorId")),
    departamentoId: emptyToNull(formData.get("departamentoId")),
    localizacaoId: emptyToNull(formData.get("localizacaoId")),
  });
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/computadores");
  revalidatePath("/monitores");
  revalidatePath("/movimentacoes");
  revalidatePath("/relatorios");
  revalidatePath("/relatorios/garantias");
  revalidatePath("/relatorios/modernizacao");
  revalidatePath("/departamentos");
  revalidatePath("/visao-geral");
}

export async function saveComputador(_: unknown, formData: FormData) {
  const session = await requireAdmin();
  const parsed = fromForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const acquisition = parseAcquisitionFromForm(formData);
  if (acquisition.error || !acquisition.data) {
    return { error: acquisition.error ?? "Dados de aquisição inválidos." };
  }

  const data = parsed.data;
  const acq = acquisition.data;
  try {
    const servidor = data.servidorId
      ? await prisma.servidor.findUnique({ where: { id: data.servidorId } })
      : null;
    const usuario = servidor?.nome ?? null;
    const departamentoId = data.departamentoId;

    let savedId = data.id;
    if (data.id) {
      const current = await prisma.computador.findUnique({
        where: { id: data.id },
        include: { departamento: true, localizacao: true },
      });
      if (!current) return { error: "Computador não encontrado." };

      const nextDept = departamentoId
        ? await prisma.departamento.findUnique({ where: { id: departamentoId } })
        : null;
      const nextLoc = data.localizacaoId
        ? await prisma.localizacao.findUnique({ where: { id: data.localizacaoId } })
        : null;

      const linkedMonitorIds = await prisma.$transaction(async (tx) => {
        await tx.computador.update({
          where: { id: data.id },
          data: {
            tombo: data.tombo,
            serialNumber: data.serialNumber,
            fabricante: data.fabricante,
            modelo: data.modelo,
            status: data.status,
            processador: data.processador,
            memoriaRam: data.memoriaRam,
            armazenamento: data.armazenamento,
            observacoes: data.observacoes,
            usuario,
            servidorId: data.servidorId,
            departamentoId,
            localizacaoId: data.localizacaoId,
            dataNotaFiscal: acq.dataNotaFiscal,
            dataRecebimento: acq.dataRecebimento,
            prazoGarantiaAnos: acq.prazoGarantiaAnos,
          },
        });
        await tx.monitor.updateMany({
          where: { computadorId: data.id, deletedAt: null },
          data: {
            usuario,
            servidorId: data.servidorId,
            departamentoId,
            localizacaoId: data.localizacaoId,
            status: data.status,
          },
        });
        const allocationChanges = [
          { campo: "status", anterior: current.status, novo: data.status },
          { campo: "departamento", anterior: current.departamento?.nome, novo: nextDept?.nome },
          { campo: "localizacao", anterior: formatPredio(current.localizacao), novo: formatPredio(nextLoc) },
          { campo: "usuario", anterior: current.usuario, novo: usuario },
        ];
        await logChanges({
          tx,
          kind: AssetKind.COMPUTER,
          computadorId: data.id,
          actorId: session.user.id,
          changes: [
            ...allocationChanges,
            { campo: "tombo", anterior: current.tombo, novo: data.tombo },
          ],
        });
        return logLinkedMonitorChanges({
          tx,
          computadorId: current.id,
          actorId: session.user.id,
          changes: allocationChanges,
        });
      });
      for (const monitorId of linkedMonitorIds) {
        revalidatePath(`/monitores/${monitorId}`);
      }
    } else {
      const created = await prisma.$transaction(async (tx) => {
        const released = await releaseDeletedTombos(tx, AssetKind.COMPUTER, [data.tombo]);
        if ("error" in released) throw new Error(released.error);
        const row = await tx.computador.create({
          data: {
            tombo: data.tombo,
            serialNumber: data.serialNumber,
            fabricante: data.fabricante,
            modelo: data.modelo,
            status: data.status,
            processador: data.processador,
            memoriaRam: data.memoriaRam,
            armazenamento: data.armazenamento,
            observacoes: data.observacoes,
            usuario,
            servidorId: data.servidorId,
            departamentoId,
            localizacaoId: data.localizacaoId,
            dataNotaFiscal: acq.dataNotaFiscal,
            dataRecebimento: acq.dataRecebimento,
            prazoGarantiaAnos: acq.prazoGarantiaAnos,
          },
        });
        await logChanges({
          tx,
          kind: AssetKind.COMPUTER,
          computadorId: row.id,
          actorId: session.user.id,
          changes: [{ campo: "created", novo: row.tombo }],
        });
        return row;
      });
      savedId = created.id;
    }
    refresh();
    return { success: true, id: savedId };
  } catch {
    return { error: "Não foi possível salvar. Verifique patrimônio e serial duplicados." };
  }
}

export async function createComputadoresLote(_: unknown, formData: FormData) {
  const session = await requireAdmin();
  if (formData.get("loteConfirmado") !== "1") {
    return { error: "Confirme o cadastro em lote." };
  }
  const range = parseTomboRange(String(formData.get("tomboInicio") ?? ""), String(formData.get("tomboFim") ?? ""));
  if ("error" in range) return { error: range.error };

  const parsed = schema.omit({ id: true, tombo: true, serialNumber: true }).safeParse({
    fabricante: emptyToNull(formData.get("fabricante")),
    modelo: emptyToNull(formData.get("modelo")),
    status: formData.get("status") || "AVAILABLE",
    processador: emptyToNull(formData.get("processador")),
    memoriaRam: emptyToNull(formData.get("memoriaRam")),
    armazenamento: emptyToNull(formData.get("armazenamento")),
    observacoes: emptyToNull(formData.get("observacoes")),
    servidorId: emptyToNull(formData.get("servidorId")),
    departamentoId: emptyToNull(formData.get("departamentoId")),
    localizacaoId: emptyToNull(formData.get("localizacaoId")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const acquisition = parseAcquisitionFromForm(formData);
  if (acquisition.error || !acquisition.data) {
    return { error: acquisition.error ?? "Dados de aquisição inválidos." };
  }

  const data = parsed.data;
  const acq = acquisition.data;
  const { tombos, start, end, count } = range.ok;

  try {
    const [servidor, departamento, localizacao] = await Promise.all([
      data.servidorId ? prisma.servidor.findUnique({ where: { id: data.servidorId } }) : null,
      data.departamentoId ? prisma.departamento.findUnique({ where: { id: data.departamentoId } }) : null,
      data.localizacaoId ? prisma.localizacao.findUnique({ where: { id: data.localizacaoId } }) : null,
    ]);
    if (data.servidorId && !servidor) return { error: "Usuário não encontrado." };
    if (data.departamentoId && !departamento) return { error: "Setor não encontrado." };
    if (data.localizacaoId && !localizacao) return { error: "Prédio não encontrado." };

    const usuario = servidor?.nome ?? null;
    const result = await prisma.$transaction(async (tx) => {
      const released = await releaseDeletedTombos(tx, AssetKind.COMPUTER, tombos);
      if ("error" in released) return released;
      await tx.computador.createMany({
        data: tombos.map((tombo) => ({
          tombo,
          serialNumber: null,
          fabricante: data.fabricante,
          modelo: data.modelo,
          status: data.status,
          processador: data.processador,
          memoriaRam: data.memoriaRam,
          armazenamento: data.armazenamento,
          observacoes: data.observacoes,
          usuario,
          servidorId: data.servidorId,
          departamentoId: data.departamentoId,
          localizacaoId: data.localizacaoId,
          dataNotaFiscal: acq.dataNotaFiscal,
          dataRecebimento: acq.dataRecebimento,
          prazoGarantiaAnos: acq.prazoGarantiaAnos,
        })),
      });
      await logChanges({
        tx,
        kind: AssetKind.COMPUTER,
        actorId: session.user.id,
        changes: [{ campo: "lote", novo: formatTomboRangeLabel({ start, end, count }) }],
      });
      return { ok: true as const };
    });
    if ("error" in result) return result;
    refresh();
    return { success: true, count };
  } catch {
    return { error: "Não foi possível criar o lote. Verifique patrimônios duplicados." };
  }
}

export async function updateAlocacaoComputador(_: unknown, formData: FormData) {
  const session = await requireSession();
  const parsed = z
    .object({
      id: z.string().min(1),
      status: statusEnum,
      servidorId: z.string().nullable(),
      departamentoId: z.string().nullable(),
      localizacaoId: z.string().nullable(),
    })
    .safeParse({
      id: String(formData.get("id") ?? ""),
      status: formData.get("status") || "AVAILABLE",
      servidorId: emptyToNull(formData.get("servidorId")),
      departamentoId: emptyToNull(formData.get("departamentoId")),
      localizacaoId: emptyToNull(formData.get("localizacaoId")),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;
  try {
    const current = await prisma.computador.findFirst({
      where: { id: data.id, deletedAt: null },
      include: { departamento: true, localizacao: true },
    });
    if (!current) return { error: "Computador não encontrado." };

    const servidor = data.servidorId
      ? await prisma.servidor.findUnique({ where: { id: data.servidorId } })
      : null;
    const usuario = servidor?.nome ?? null;
    const nextDept = data.departamentoId
      ? await prisma.departamento.findUnique({ where: { id: data.departamentoId } })
      : null;
    const nextLoc = data.localizacaoId
      ? await prisma.localizacao.findUnique({ where: { id: data.localizacaoId } })
      : null;

    const allocationChanges = [
      { campo: "status", anterior: current.status, novo: data.status },
      { campo: "departamento", anterior: current.departamento?.nome, novo: nextDept?.nome },
      { campo: "localizacao", anterior: formatPredio(current.localizacao), novo: formatPredio(nextLoc) },
      { campo: "usuario", anterior: current.usuario, novo: usuario },
    ];

    const linkedMonitorIds = await prisma.$transaction(async (tx) => {
      await tx.computador.update({
        where: { id: data.id },
        data: {
          status: data.status,
          usuario,
          servidorId: data.servidorId,
          departamentoId: data.departamentoId,
          localizacaoId: data.localizacaoId,
        },
      });
      await tx.monitor.updateMany({
        where: { computadorId: data.id, deletedAt: null },
        data: {
          usuario,
          servidorId: data.servidorId,
          departamentoId: data.departamentoId,
          localizacaoId: data.localizacaoId,
          status: data.status,
        },
      });
      await logChanges({
        tx,
        kind: AssetKind.COMPUTER,
        computadorId: data.id,
        actorId: session.user.id,
        changes: allocationChanges,
      });
      return logLinkedMonitorChanges({
        tx,
        computadorId: data.id,
        actorId: session.user.id,
        changes: allocationChanges,
      });
    });

    refresh();
    revalidatePath(`/computadores/${data.id}`);
    for (const monitorId of linkedMonitorIds) {
      revalidatePath(`/monitores/${monitorId}`);
    }
    return { success: true, id: data.id };
  } catch {
    return { error: "Não foi possível atualizar a alocação." };
  }
}

export async function deleteComputador(id: string) {
  const session = await requireAdmin();
  const current = await prisma.computador.findUnique({ where: { id } });
  if (!current) return { error: "Computador não encontrado." };
  if (current.status === "IN_USE") {
    return { error: "Desaloque ou altere o status antes de excluir um equipamento em uso." };
  }
  await prisma.$transaction([
    prisma.monitor.updateMany({ where: { computadorId: id }, data: { computadorId: null } }),
    prisma.computador.update({
      where: { id },
      data: { deletedAt: new Date(), status: "INACTIVE", ...retireAssetKeys(id, current.tombo, current.serialNumber) },
    }),
  ]);
  await logChanges({
    kind: AssetKind.COMPUTER,
    computadorId: id,
    actorId: session.user.id,
    changes: [{ campo: "deleted", anterior: current.tombo, novo: "inativo" }],
  });
  refresh();
  return { success: true };
}
