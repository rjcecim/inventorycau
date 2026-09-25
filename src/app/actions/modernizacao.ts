"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { calendarToDbDate, calendarToIso, parseIsoDate, toCalendarDate } from "@/lib/dates";
import {
  buildModernizationIndexes,
  computeModernization,
  isInModernizationScope,
} from "@/lib/modernizacao";
import { monitorAlocacao, setorLabel } from "@/lib/alocacao";
import { computerRowKind } from "@/lib/inventory-kind";
import { prisma } from "@/lib/prisma";
import { emptyToNull } from "@/lib/utils";

const schema = z.object({
  ano: z.number().int().min(2000).max(2100),
  dataReferencia: z.string().min(1),
  observacao: z.string().max(500).nullable(),
});

export async function saveApuracaoModernizacao(_: unknown, formData: FormData) {
  const session = await requireAdmin();

  const parsed = schema.safeParse({
    ano: Number(formData.get("ano")),
    dataReferencia: String(formData.get("dataReferencia") ?? "").trim(),
    observacao: emptyToNull(formData.get("observacao")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const asOf = parseIsoDate(parsed.data.dataReferencia);
  if (!asOf) return { error: "Data de referência inválida." };

  const existing = await prisma.apuracaoModernizacao.findUnique({
    where: { ano: parsed.data.ano },
  });
  if (existing) {
    return { error: `Já existe apuração salva para o ano ${parsed.data.ano}.` };
  }

  const [computers, monitors] = await Promise.all([
    prisma.computador.findMany({
      where: { deletedAt: null },
      include: { departamento: true },
      orderBy: { tombo: "asc" },
    }),
    prisma.monitor.findMany({
      where: { deletedAt: null },
      include: {
        departamento: true,
      },
      orderBy: { tombo: "asc" },
    }),
  ]);

  const liveRows = [
    ...computers.map((item) => ({
      id: item.id,
      kind: computerRowKind(item.tipo),
      tombo: item.tombo,
      fabricante: item.fabricante,
      modelo: item.modelo,
      setorId: item.departamentoId,
      setorLabel: setorLabel(item.departamento),
      dataRecebimento: item.dataRecebimento,
    })),
    ...monitors.map((item) => {
      const aloc = monitorAlocacao(item);
      return {
        id: item.id,
        kind: "MONITOR" as const,
        tombo: item.tombo,
        fabricante: item.fabricante,
        modelo: item.modelo,
        setorId: item.departamentoId,
        setorLabel: setorLabel(aloc.departamento),
        dataRecebimento: item.dataRecebimento,
      };
    }),
  ].filter((row) => isInModernizationScope({ dataRecebimento: row.dataRecebimento, asOf }));

  const indexes = buildModernizationIndexes(
    liveRows.map((row) => ({ kind: row.kind, dataRecebimento: row.dataRecebimento })),
    asOf,
  );

  const equipamentos = liveRows.map((row) => {
    const mod = computeModernization({
      kind: row.kind,
      dataRecebimento: row.dataRecebimento,
      asOf,
    });
    return {
      id: row.id,
      kind: row.kind,
      tombo: row.tombo,
      fabricante: row.fabricante,
      modelo: row.modelo,
      setorId: row.setorId,
      setorLabel: row.setorLabel,
      dataRecebimento: row.dataRecebimento ? calendarToIso(toCalendarDate(row.dataRecebimento)!) : null,
      prazoAnos: mod.years,
      dataLimite: mod.deadline ? calendarToIso(mod.deadline) : null,
      situation: mod.situation,
      situationLabel: mod.situationLabel,
      daysRemaining: mod.daysRemaining,
      daysLabel: mod.daysLabel,
    };
  });

  await prisma.apuracaoModernizacao.create({
    data: {
      ano: parsed.data.ano,
      dataReferencia: calendarToDbDate(asOf),
      escopo: "computadores_notebooks_e_monitores",
      resultado: indexes,
      equipamentos,
      observacao: parsed.data.observacao,
      createdById: session.user.id,
    },
  });

  revalidatePath("/relatorios/modernizacao");
  revalidatePath("/relatorios");
  return { ok: `Apuração do ano ${parsed.data.ano} salva com sucesso.` };
}
