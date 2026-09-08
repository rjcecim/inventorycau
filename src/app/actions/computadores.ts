"use server";

import { AssetKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { logChanges } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { emptyToNull } from "@/lib/utils";
import { formatPredio } from "@/lib/predios";

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
  hostname: z.string().max(80).nullable(),
  serialNumber: z.string().max(80).nullable(),
  fabricante: z.string().max(80).nullable(),
  modelo: z.string().max(120).nullable(),
  status: statusEnum,
  processador: z.string().max(120).nullable(),
  memoriaRam: z.string().max(80).nullable(),
  armazenamento: z.string().max(80).nullable(),
  sistemaOperacional: z.string().max(80).nullable(),
  soVersao: z.string().max(80).nullable(),
  arquitetura: z.string().max(40).nullable(),
  observacoes: z.string().max(1000).nullable(),
  usuario: z.string().max(150).nullable(),
  servidorId: z.string().nullable(),
  departamentoId: z.string().nullable(),
  localizacaoId: z.string().nullable(),
});

function fromForm(formData: FormData) {
  return schema.safeParse({
    id: emptyToNull(formData.get("id")) ?? undefined,
    tombo: String(formData.get("tombo") ?? "").trim(),
    hostname: emptyToNull(formData.get("hostname")),
    serialNumber: emptyToNull(formData.get("serialNumber")),
    fabricante: emptyToNull(formData.get("fabricante")),
    modelo: emptyToNull(formData.get("modelo")),
    status: formData.get("status") || "AVAILABLE",
    processador: emptyToNull(formData.get("processador")),
    memoriaRam: emptyToNull(formData.get("memoriaRam")),
    armazenamento: emptyToNull(formData.get("armazenamento")),
    sistemaOperacional: emptyToNull(formData.get("sistemaOperacional")),
    soVersao: emptyToNull(formData.get("soVersao")),
    arquitetura: emptyToNull(formData.get("arquitetura")),
    observacoes: emptyToNull(formData.get("observacoes")),
    usuario: emptyToNull(formData.get("usuario")),
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
  revalidatePath("/departamentos");
}

export async function saveComputador(_: unknown, formData: FormData) {
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

      await prisma.$transaction(async (tx) => {
        await tx.computador.update({
          where: { id: data.id },
          data: {
            tombo: data.tombo,
            hostname: data.hostname,
            serialNumber: data.serialNumber,
            fabricante: data.fabricante,
            modelo: data.modelo,
            status: data.status,
            processador: data.processador,
            memoriaRam: data.memoriaRam,
            armazenamento: data.armazenamento,
            sistemaOperacional: data.sistemaOperacional,
            soVersao: data.soVersao,
            arquitetura: data.arquitetura,
            observacoes: data.observacoes,
            usuario,
            servidorId: data.servidorId,
            departamentoId,
            localizacaoId: data.localizacaoId,
          },
        });
        await logChanges({
          tx,
          kind: AssetKind.COMPUTER,
          computadorId: data.id,
          actorId: session.user.id,
          changes: [
            { campo: "status", anterior: current.status, novo: data.status },
            { campo: "departamento", anterior: current.departamento?.nome, novo: nextDept?.nome },
            { campo: "localizacao", anterior: formatPredio(current.localizacao), novo: formatPredio(nextLoc) },
            { campo: "usuario", anterior: current.usuario, novo: usuario },
            { campo: "hostname", anterior: current.hostname, novo: data.hostname },
            { campo: "tombo", anterior: current.tombo, novo: data.tombo },
          ],
        });
      });
    } else {
      const created = await prisma.computador.create({
        data: {
          tombo: data.tombo,
          hostname: data.hostname,
          serialNumber: data.serialNumber,
          fabricante: data.fabricante,
          modelo: data.modelo,
          status: data.status,
          processador: data.processador,
          memoriaRam: data.memoriaRam,
          armazenamento: data.armazenamento,
          sistemaOperacional: data.sistemaOperacional,
          soVersao: data.soVersao,
          arquitetura: data.arquitetura,
          observacoes: data.observacoes,
          usuario,
          servidorId: data.servidorId,
          departamentoId,
          localizacaoId: data.localizacaoId,
        },
      });
      await logChanges({
        kind: AssetKind.COMPUTER,
        computadorId: created.id,
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

export async function deleteComputador(id: string) {
  const session = await requireAdmin();
  const current = await prisma.computador.findUnique({ where: { id } });
  if (!current) return { error: "Computador não encontrado." };
  if (current.status === "IN_USE") {
    return { error: "Desaloque ou altere o status antes de excluir um equipamento em uso." };
  }
  await prisma.$transaction([
    prisma.monitor.updateMany({ where: { computadorId: id }, data: { computadorId: null } }),
    prisma.computador.update({ where: { id }, data: { deletedAt: new Date(), status: "INACTIVE" } }),
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
