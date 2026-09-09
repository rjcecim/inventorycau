"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { emptyToNull } from "@/lib/utils";

function refresh() {
  revalidatePath("/usuarios");
  revalidatePath("/departamentos");
  revalidatePath("/computadores");
  revalidatePath("/monitores");
  revalidatePath("/");
}

export async function saveServidor(_: unknown, formData: FormData) {
  await requireAdmin();
  const parsed = z.object({
    id: z.string().optional(),
    nome: z.string().min(1, "Nome é obrigatório").max(150),
    email: z.union([z.string().email("E-mail inválido"), z.literal("")]).nullable().transform((v) => v || null),
    matricula: z.string().max(40).nullable(),
    cargo: z.string().max(120).nullable(),
    departamentoId: z.string().min(1, "Setor é obrigatório"),
    ativo: z.enum(["true", "false"]).transform((v) => v === "true"),
  }).safeParse({
    id: emptyToNull(formData.get("id")) ?? undefined,
    nome: String(formData.get("nome") ?? "").trim(),
    email: emptyToNull(formData.get("email")) ?? "",
    matricula: emptyToNull(formData.get("matricula")),
    cargo: emptyToNull(formData.get("cargo")),
    departamentoId: emptyToNull(formData.get("departamentoId")),
    ativo: formData.get("ativo") === "false" ? "false" : "true",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    if (parsed.data.id) {
      await prisma.servidor.update({
        where: { id: parsed.data.id },
        data: {
          nome: parsed.data.nome,
          email: parsed.data.email,
          matricula: parsed.data.matricula,
          cargo: parsed.data.cargo,
          departamentoId: parsed.data.departamentoId,
          ativo: parsed.data.ativo,
        },
      });
      await prisma.computador.updateMany({
        where: { servidorId: parsed.data.id },
        data: { usuario: parsed.data.nome, departamentoId: parsed.data.departamentoId },
      });
      await prisma.monitor.updateMany({
        where: { servidorId: parsed.data.id },
        data: { usuario: parsed.data.nome, departamentoId: parsed.data.departamentoId },
      });
    } else {
      await prisma.servidor.create({
        data: {
          nome: parsed.data.nome,
          email: parsed.data.email,
          matricula: parsed.data.matricula,
          cargo: parsed.data.cargo,
          departamentoId: parsed.data.departamentoId,
          ativo: parsed.data.ativo,
        },
      });
    }
    refresh();
    return { success: true };
  } catch {
    return { error: "Não foi possível salvar. Verifique se a matrícula já existe." };
  }
}

export async function deleteServidor(id: string) {
  await requireAdmin();
  const linked = await prisma.computador.count({ where: { servidorId: id, deletedAt: null } });
  if (linked) {
    await prisma.computador.updateMany({ where: { servidorId: id }, data: { servidorId: null, usuario: null } });
  }
  await prisma.monitor.updateMany({ where: { servidorId: id }, data: { servidorId: null, usuario: null } });
  await prisma.servidor.delete({ where: { id } });
  refresh();
  return { success: true };
}
