"use server";

import { AssetKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireSession } from "@/lib/authz";
import { logChanges } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { emptyToNull } from "@/lib/utils";
import { formatPredio } from "@/lib/predios";
import { parseAcquisitionFromForm } from "@/lib/acquisition-form";
import { formatTomboRangeLabel, parseTomboRange } from "@/lib/tombo-range";

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
  revalidatePath("/relatorios/garantias");
  revalidatePath("/relatorios/modernizacao");
  revalidatePath("/visao-geral");
}

export async function saveMonitor(_: unknown, formData: FormData) {
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
    const computador = data.computadorId
      ? await prisma.computador.findUnique({ where: { id: data.computadorId } })
      : null;
    if (data.computadorId && !computador) return { error: "Computador não encontrado." };

    const servidor = !computador && data.servidorId
      ? await prisma.servidor.findUnique({ where: { id: data.servidorId } })
      : null;

    const usuario = computador?.usuario ?? servidor?.nome ?? null;
    const servidorId = computador?.servidorId ?? data.servidorId;
    const departamentoId = computador?.departamentoId ?? data.departamentoId;
    const localizacaoId = computador?.localizacaoId ?? data.localizacaoId;
    const status = computador?.status ?? data.status;

    let savedId = data.id;
    if (data.id) {
      const current = await prisma.monitor.findUnique({
        where: { id: data.id },
        include: { departamento: true, localizacao: true, computador: true },
      });
      if (!current) return { error: "Monitor não encontrado." };
      const nextDept = departamentoId
        ? await prisma.departamento.findUnique({ where: { id: departamentoId } })
        : null;
      const nextLoc = localizacaoId
        ? await prisma.localizacao.findUnique({ where: { id: localizacaoId } })
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
            status,
            observacoes: data.observacoes,
            usuario,
            servidorId,
            departamentoId,
            localizacaoId,
            computadorId: data.computadorId,
            dataNotaFiscal: acq.dataNotaFiscal,
            dataRecebimento: acq.dataRecebimento,
            prazoGarantiaAnos: acq.prazoGarantiaAnos,
          },
        });
        await logChanges({
          tx,
          kind: AssetKind.MONITOR,
          monitorId: data.id,
          actorId: session.user.id,
          changes: [
            { campo: "status", anterior: current.status, novo: status },
            { campo: "departamento", anterior: current.departamento?.nome, novo: nextDept?.nome },
            { campo: "localizacao", anterior: formatPredio(current.localizacao), novo: formatPredio(nextLoc) },
            { campo: "usuario", anterior: current.usuario, novo: usuario },
            { campo: "computador", anterior: current.computador?.tombo, novo: computador?.tombo },
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
          status,
          observacoes: data.observacoes,
          usuario,
          servidorId,
          departamentoId,
          localizacaoId,
          computadorId: data.computadorId,
          dataNotaFiscal: acq.dataNotaFiscal,
          dataRecebimento: acq.dataRecebimento,
          prazoGarantiaAnos: acq.prazoGarantiaAnos,
        },
      });
      await logChanges({
        kind: AssetKind.MONITOR,
        monitorId: created.id,
        actorId: session.user.id,
        changes: [{ campo: "created", novo: created.tombo }],
      });
      savedId = created.id;
    }
    refresh();
    return { success: true, id: savedId };
  } catch {
    return { error: "Não foi possível salvar. Verifique patrimônio e serial duplicados." };
  }
}

export async function createMonitoresLote(_: unknown, formData: FormData) {
  const session = await requireAdmin();
  if (formData.get("loteConfirmado") !== "1") {
    return { error: "Confirme o cadastro em lote." };
  }
  const range = parseTomboRange(String(formData.get("tomboInicio") ?? ""), String(formData.get("tomboFim") ?? ""));
  if ("error" in range) return { error: range.error };

  const parsed = schema.omit({ id: true, tombo: true, serialNumber: true, computadorId: true }).safeParse({
    fabricante: emptyToNull(formData.get("fabricante")),
    modelo: emptyToNull(formData.get("modelo")),
    tamanho: emptyToNull(formData.get("tamanho")),
    resolucao: emptyToNull(formData.get("resolucao")),
    conexoes: emptyToNull(formData.get("conexoes")),
    status: formData.get("status") || "AVAILABLE",
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
    const [servidor, existing] = await Promise.all([
      data.servidorId ? prisma.servidor.findUnique({ where: { id: data.servidorId } }) : null,
      prisma.monitor.findMany({
        where: { tombo: { in: tombos } },
        select: { tombo: true },
        orderBy: { tombo: "asc" },
      }),
    ]);
    if (existing.length) {
      const sample = existing.slice(0, 8).map((item) => item.tombo).join(", ");
      const extra = existing.length > 8 ? ` e mais ${existing.length - 8}` : "";
      return { error: `Já existem ${existing.length} patrimônios nessa faixa: ${sample}${extra}.` };
    }

    const usuario = servidor?.nome ?? null;
    await prisma.$transaction(async (tx) => {
      await tx.monitor.createMany({
        data: tombos.map((tombo) => ({
          tombo,
          serialNumber: null,
          fabricante: data.fabricante,
          modelo: data.modelo,
          tamanho: data.tamanho,
          resolucao: data.resolucao,
          conexoes: data.conexoes,
          status: data.status,
          observacoes: data.observacoes,
          usuario,
          servidorId: data.servidorId,
          departamentoId: data.departamentoId,
          localizacaoId: data.localizacaoId,
          computadorId: null,
          dataNotaFiscal: acq.dataNotaFiscal,
          dataRecebimento: acq.dataRecebimento,
          prazoGarantiaAnos: acq.prazoGarantiaAnos,
        })),
      });
      await logChanges({
        tx,
        kind: AssetKind.MONITOR,
        actorId: session.user.id,
        changes: [{ campo: "lote", novo: formatTomboRangeLabel({ start, end, count }) }],
      });
    });
    refresh();
    return { success: true, count };
  } catch {
    return { error: "Não foi possível criar o lote. Verifique patrimônios duplicados." };
  }
}

export async function updateAlocacaoMonitor(_: unknown, formData: FormData) {
  const session = await requireSession();
  const parsed = z
    .object({
      id: z.string().min(1),
      status: z.enum([
        "IN_USE",
        "AVAILABLE",
        "RESERVE",
        "MAINTENANCE",
        "AWAITING_INSTALL",
        "DISPOSED",
        "INACTIVE",
      ]),
      servidorId: z.string().nullable(),
      departamentoId: z.string().nullable(),
      localizacaoId: z.string().nullable(),
      computadorId: z.string().nullable(),
    })
    .safeParse({
      id: String(formData.get("id") ?? ""),
      status: formData.get("status") || "AVAILABLE",
      servidorId: emptyToNull(formData.get("servidorId")),
      departamentoId: emptyToNull(formData.get("departamentoId")),
      localizacaoId: emptyToNull(formData.get("localizacaoId")),
      computadorId: emptyToNull(formData.get("computadorId")),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;
  try {
    const current = await prisma.monitor.findFirst({
      where: { id: data.id, deletedAt: null },
      include: { departamento: true, localizacao: true, computador: true },
    });
    if (!current) return { error: "Monitor não encontrado." };

    const computador = data.computadorId
      ? await prisma.computador.findUnique({ where: { id: data.computadorId } })
      : null;
    if (data.computadorId && !computador) return { error: "Computador não encontrado." };

    const servidor = !computador && data.servidorId
      ? await prisma.servidor.findUnique({ where: { id: data.servidorId } })
      : null;

    const usuario = computador?.usuario ?? servidor?.nome ?? null;
    const servidorId = computador?.servidorId ?? data.servidorId;
    const departamentoId = computador?.departamentoId ?? data.departamentoId;
    const localizacaoId = computador?.localizacaoId ?? data.localizacaoId;
    const status = computador?.status ?? data.status;

    const nextDept = departamentoId
      ? await prisma.departamento.findUnique({ where: { id: departamentoId } })
      : null;
    const nextLoc = localizacaoId
      ? await prisma.localizacao.findUnique({ where: { id: localizacaoId } })
      : null;

    await prisma.$transaction(async (tx) => {
      await tx.monitor.update({
        where: { id: data.id },
        data: {
          status,
          usuario,
          servidorId,
          departamentoId,
          localizacaoId,
          computadorId: data.computadorId,
        },
      });
      await logChanges({
        tx,
        kind: AssetKind.MONITOR,
        monitorId: data.id,
        actorId: session.user.id,
        changes: [
          { campo: "status", anterior: current.status, novo: status },
          { campo: "departamento", anterior: current.departamento?.nome, novo: nextDept?.nome },
          { campo: "localizacao", anterior: formatPredio(current.localizacao), novo: formatPredio(nextLoc) },
          { campo: "usuario", anterior: current.usuario, novo: usuario },
          { campo: "computador", anterior: current.computador?.tombo, novo: computador?.tombo },
        ],
      });
    });

    refresh();
    revalidatePath(`/monitores/${data.id}`);
    return { success: true, id: data.id };
  } catch {
    return { error: "Não foi possível atualizar a alocação." };
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
