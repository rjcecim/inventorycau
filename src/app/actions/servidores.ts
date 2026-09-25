"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { emptyToNull } from "@/lib/utils";

function refresh() {
  revalidatePath("/usuarios");
  revalidatePath("/computadores");
  revalidatePath("/notebooks");
  revalidatePath("/monitores");
  revalidatePath("/");
}

export async function saveServidor(_: unknown, formData: FormData) {
  await requireAdmin();
  const parsed = z.object({
    id: z.string().optional(),
    nome: z.string().min(1, "Nome é obrigatório").max(150),
    matricula: z.string().min(1, "Matrícula é obrigatória").max(40),
    cargo: z.string().max(120).nullable(),
  }).safeParse({
    id: emptyToNull(formData.get("id")) ?? undefined,
    nome: String(formData.get("nome") ?? "").trim(),
    matricula: String(formData.get("matricula") ?? "").trim(),
    cargo: emptyToNull(formData.get("cargo")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    if (parsed.data.id) {
      await prisma.servidor.update({
        where: { id: parsed.data.id },
        data: {
          nome: parsed.data.nome,
          matricula: parsed.data.matricula,
          cargo: parsed.data.cargo,
        },
      });
      await prisma.computador.updateMany({
        where: { servidorId: parsed.data.id },
        data: { usuario: parsed.data.nome },
      });
      await prisma.monitor.updateMany({
        where: { servidorId: parsed.data.id },
        data: { usuario: parsed.data.nome },
      });
    } else {
      await prisma.servidor.create({
        data: {
          nome: parsed.data.nome,
          matricula: parsed.data.matricula,
          cargo: parsed.data.cargo,
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
