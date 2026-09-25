"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { compareSetorCodigo, parentSetorCodigo } from "@/lib/setor-codigo";
import { emptyToNull } from "@/lib/utils";

async function placeSetor(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  id: string,
  codigo: string,
) {
  const others = await tx.departamento.findMany({
    where: { id: { not: id } },
    orderBy: { sortOrder: "asc" },
    select: { id: true, codigo: true },
  });
  const insertAt = others.findIndex((item) => compareSetorCodigo(item.codigo, codigo) > 0);
  const index = insertAt === -1 ? others.length : insertAt;
  const sequence = [
    ...others.slice(0, index).map((item) => item.id),
    id,
    ...others.slice(index).map((item) => item.id),
  ];
  for (let sortOrder = 0; sortOrder < sequence.length; sortOrder++) {
    await tx.departamento.update({
      where: { id: sequence[sortOrder] },
      data: { sortOrder },
    });
  }
}

function refreshSetores() {
  revalidatePath("/departamentos");
  revalidatePath("/usuarios");
  revalidatePath("/");
  revalidatePath("/computadores");
  revalidatePath("/notebooks");
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
  const parentCodigo = parentSetorCodigo(parsed.data.codigo);
  const parent = parentCodigo
    ? await prisma.departamento.findUnique({ where: { codigo: parentCodigo }, select: { id: true } })
    : null;
  if (parentCodigo && !parent) {
    return { error: `Cadastre primeiro o setor ${parentCodigo}.` };
  }
  const parentId = parent?.id ?? null;
  if (parsed.data.id && parentId === parsed.data.id) {
    return { error: "Um setor não pode ser pai de si mesmo." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (parsed.data.id) {
        const current = await tx.departamento.findUnique({
          where: { id: parsed.data.id },
          select: { codigo: true },
        });
        await tx.departamento.update({
          where: { id: parsed.data.id },
          data: {
            codigo: parsed.data.codigo,
            nome: parsed.data.nome,
            parentId,
            nivel,
          },
        });
        if (current?.codigo !== parsed.data.codigo) {
          await placeSetor(tx, parsed.data.id, parsed.data.codigo);
        }
      } else {
        const created = await tx.departamento.create({
          data: {
            codigo: parsed.data.codigo,
            nome: parsed.data.nome,
            parentId,
            nivel,
            sortOrder: 0,
          },
        });
        await placeSetor(tx, created.id, parsed.data.codigo);
      }
    });
    refreshSetores();
    return { success: true };
  } catch {
    return { error: "Erro ao salvar setor. Verifique se o código já existe." };
  }
}

export async function deleteDepartamento(id: string) {
  await requireAdmin();
  const [computers, monitors, children] = await Promise.all([
    prisma.computador.count({ where: { departamentoId: id, deletedAt: null } }),
    prisma.monitor.count({ where: { departamentoId: id, deletedAt: null } }),
    prisma.departamento.count({ where: { parentId: id } }),
  ]);
  if (children) return { error: "Remova ou realoque os subsetores antes de excluir." };
  if (computers || monitors) return { error: "Há equipamentos vinculados a este setor." };
  try {
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
    revalidatePath("/notebooks");
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
  revalidatePath("/notebooks");
  revalidatePath("/monitores");
  return { success: true };
}
