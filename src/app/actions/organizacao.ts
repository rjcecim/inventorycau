"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { emptyToNull } from "@/lib/utils";

function refreshSetores() {
  revalidatePath("/departamentos");
  revalidatePath("/usuarios");
  revalidatePath("/");
  revalidatePath("/computadores");
  revalidatePath("/monitores");
}

export async function saveDepartamento(_: unknown, formData: FormData) {
  await requireAdmin();
  const parsed = z.object({
    id: z.string().optional(),
    codigo: z.string().min(1, "Código é obrigatório").max(20),
    nome: z.string().min(1, "Nome é obrigatório").max(200),
    parentId: z.string().nullable(),
  }).safeParse({
    id: emptyToNull(formData.get("id")) ?? undefined,
    codigo: String(formData.get("codigo") ?? "").trim(),
    nome: String(formData.get("nome") ?? "").trim(),
    parentId: emptyToNull(formData.get("parentId")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const nivel = parsed.data.codigo.split(".").length;
  const maxOrder = await prisma.departamento.aggregate({ _max: { sortOrder: true } });
  const nextOrder = (maxOrder._max.sortOrder ?? 0) + 1;

  try {
    if (parsed.data.id) {
      if (parsed.data.parentId === parsed.data.id) {
        return { error: "Um setor não pode ser pai de si mesmo." };
      }
      await prisma.departamento.update({
        where: { id: parsed.data.id },
        data: {
          codigo: parsed.data.codigo,
          nome: parsed.data.nome,
          parentId: parsed.data.parentId,
          nivel,
        },
      });
    } else {
      await prisma.departamento.create({
        data: {
          codigo: parsed.data.codigo,
          nome: parsed.data.nome,
          parentId: parsed.data.parentId,
          nivel,
          sortOrder: nextOrder,
        },
      });
    }
    refreshSetores();
    return { success: true };
  } catch {
    return { error: "Erro ao salvar setor. Verifique se o código já existe." };
  }
}

export async function deleteDepartamento(id: string) {
  await requireAdmin();
  const [computers, monitors, children, people] = await Promise.all([
    prisma.computador.count({ where: { departamentoId: id, deletedAt: null } }),
    prisma.monitor.count({ where: { departamentoId: id, deletedAt: null } }),
    prisma.departamento.count({ where: { parentId: id } }),
    prisma.servidor.count({ where: { departamentoId: id } }),
  ]);
  if (children) return { error: "Remova ou realoque os subsetores antes de excluir." };
  if (computers || monitors) return { error: "Há equipamentos vinculados a este setor." };
  if (people) return { error: "Há usuários vinculados a este setor." };
  try {
    await prisma.alocacao.deleteMany({ where: { departamentoId: id } });
    await prisma.departamento.delete({ where: { id } });
    refreshSetores();
    return { success: true };
  } catch {
    return { error: "Não foi possível excluir o setor." };
  }
}

export async function saveLocalizacao(_: unknown, formData: FormData) {
  await requireAdmin();
  const parsed = z.object({
    id: z.string().optional(),
    nome: z.string().min(1, "Nome do prédio é obrigatório").max(100),
    cidade: z.string().min(1, "Cidade é obrigatória").max(80),
    uf: z.string().length(2, "Informe a UF"),
  }).safeParse({
    id: emptyToNull(formData.get("id")) ?? undefined,
    nome: String(formData.get("nome") ?? "").trim(),
    cidade: String(formData.get("cidade") ?? "").trim(),
    uf: emptyToNull(formData.get("uf"))?.toUpperCase() ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const data = {
      nome: parsed.data.nome,
      cidade: parsed.data.cidade,
      uf: parsed.data.uf,
    };
    if (parsed.data.id) {
      await prisma.localizacao.update({
        where: { id: parsed.data.id },
        data,
      });
    } else {
      await prisma.localizacao.create({ data });
    }
    revalidatePath("/localizacoes");
    revalidatePath("/");
    revalidatePath("/computadores");
    revalidatePath("/monitores");
    return { success: true };
  } catch {
    return { error: "Erro ao salvar prédio." };
  }
}

export async function deleteLocalizacao(id: string) {
  await requireAdmin();
  const [computers, monitors] = await Promise.all([
    prisma.computador.count({ where: { localizacaoId: id, deletedAt: null } }),
    prisma.monitor.count({ where: { localizacaoId: id, deletedAt: null } }),
  ]);
  if (computers || monitors) return { error: "Há equipamentos neste prédio." };
  await prisma.localizacao.delete({ where: { id } });
  revalidatePath("/localizacoes");
  revalidatePath("/");
  revalidatePath("/computadores");
  revalidatePath("/monitores");
  return { success: true };
}
