"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireSession } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { emptyToNull } from "@/lib/utils";
import { generateOtp, generateTempPassword, hashSecret, otpExpiry, sendPasswordOtp, verifySecret } from "@/lib/accounts";

function refresh() {
  revalidatePath("/contas");
  revalidatePath("/conta");
}

const loginSchema = z.string().min(3, "Login deve ter ao menos 3 caracteres").max(50).regex(/^[a-zA-Z0-9._-]+$/, "Use apenas letras, números, ponto, hífen ou underline.");
const emailSchema = z.string().email("Informe um e-mail válido.").max(120);
const nameSchema = z.string().min(2, "Nome é obrigatório").max(120);

async function findByLogin(login: string) {
  const value = login.trim();
  return prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: value, mode: "insensitive" } },
        { contactEmail: { equals: value, mode: "insensitive" } },
      ],
    },
  });
}

export async function createAccount(_: unknown, formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      login: loginSchema,
      fullName: nameSchema,
      contactEmail: emailSchema,
      role: z.enum(["ADMIN", "USER"]),
    })
    .safeParse({
      login: String(formData.get("login") ?? "").trim().toLowerCase(),
      fullName: String(formData.get("fullName") ?? "").trim(),
      contactEmail: String(formData.get("contactEmail") ?? "").trim().toLowerCase(),
      role: formData.get("role") || "USER",
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const exists = await prisma.user.findFirst({
    where: {
      OR: [
        { email: parsed.data.login },
        { contactEmail: parsed.data.contactEmail },
      ],
    },
  });
  if (exists) return { error: "Já existe uma conta com este login ou e-mail." };

  const password = generateTempPassword();
  await prisma.user.create({
    data: {
      email: parsed.data.login,
      fullName: parsed.data.fullName,
      contactEmail: parsed.data.contactEmail,
      role: parsed.data.role as Role,
      passwordHash: await hashSecret(password),
      mustChangePassword: true,
    },
  });
  refresh();
  return { success: true, password, login: parsed.data.login };
}

export async function updateAccount(_: unknown, formData: FormData) {
  const session = await requireAdmin();
  const parsed = z
    .object({
      id: z.string().min(1),
      fullName: nameSchema,
      contactEmail: emailSchema,
      role: z.enum(["ADMIN", "USER"]),
    })
    .safeParse({
      id: String(formData.get("id") ?? ""),
      fullName: String(formData.get("fullName") ?? "").trim(),
      contactEmail: String(formData.get("contactEmail") ?? "").trim().toLowerCase(),
      role: formData.get("role") || "USER",
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const current = await prisma.user.findUnique({ where: { id: parsed.data.id } });
  if (!current) return { error: "Conta não encontrada." };

  if (current.id === session.user.id && parsed.data.role !== "ADMIN") {
    return { error: "Você não pode remover o próprio perfil de administrador." };
  }

  if (current.role === "ADMIN" && parsed.data.role !== "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) return { error: "É preciso manter ao menos um administrador." };
  }

  const clash = await prisma.user.findFirst({
    where: { contactEmail: parsed.data.contactEmail, NOT: { id: current.id } },
  });
  if (clash) return { error: "Este e-mail já está em uso." };

  await prisma.user.update({
    where: { id: current.id },
    data: {
      fullName: parsed.data.fullName,
      contactEmail: parsed.data.contactEmail,
      role: parsed.data.role as Role,
    },
  });
  refresh();
  return { success: true };
}

export async function resetAccountPassword(id: string) {
  await requireAdmin();
  const current = await prisma.user.findUnique({ where: { id } });
  if (!current) return { error: "Conta não encontrada." };
  const password = generateTempPassword();
  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: await hashSecret(password),
      mustChangePassword: true,
      otpHash: null,
      otpExpiresAt: null,
    },
  });
  refresh();
  return { success: true, password, login: current.email };
}

export async function deleteAccount(id: string) {
  const session = await requireAdmin();
  if (session.user.id === id) return { error: "Você não pode excluir a própria conta por aqui. Use Minha conta." };
  const current = await prisma.user.findUnique({ where: { id } });
  if (!current) return { error: "Conta não encontrada." };
  if (current.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) return { error: "É preciso manter ao menos um administrador." };
  }
  await prisma.user.delete({ where: { id } });
  refresh();
  return { success: true };
}

export async function updateOwnProfile(_: unknown, formData: FormData) {
  const session = await requireSession();
  const parsed = z
    .object({
      fullName: nameSchema,
      contactEmail: emailSchema,
    })
    .safeParse({
      fullName: String(formData.get("fullName") ?? "").trim(),
      contactEmail: String(formData.get("contactEmail") ?? "").trim().toLowerCase(),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const clash = await prisma.user.findFirst({
    where: { contactEmail: parsed.data.contactEmail, NOT: { id: session.user.id } },
  });
  if (clash) return { error: "Este e-mail já está em uso." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { fullName: parsed.data.fullName, contactEmail: parsed.data.contactEmail },
  });
  refresh();
  return { success: true };
}

export async function changeForcedPassword(_: unknown, formData: FormData) {
  const session = await requireSession();
  const parsed = z
    .object({
      current: z.string().min(1, "Informe a senha atual."),
      next: z.string().min(6, "A nova senha deve ter ao menos 6 caracteres."),
      confirm: z.string().min(1),
    })
    .safeParse({
      current: String(formData.get("current") ?? ""),
      next: String(formData.get("next") ?? ""),
      confirm: String(formData.get("confirm") ?? ""),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.next !== parsed.data.confirm) return { error: "A confirmação da senha não confere." };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Conta não encontrada." };
  const valid = await verifySecret(parsed.data.current, user.passwordHash);
  if (!valid) return { error: "Senha atual inválida." };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashSecret(parsed.data.next),
      mustChangePassword: false,
      otpHash: null,
      otpExpiresAt: null,
    },
  });
  return { success: true };
}

export async function requestPasswordOtp(login?: string) {
  const session = await requireSession().catch(() => null);
  const target = login
    ? await findByLogin(login)
    : session?.user?.id
      ? await prisma.user.findUnique({ where: { id: session.user.id } })
      : null;

  if (!target?.contactEmail) {
    return login
      ? { success: true }
      : { error: "Cadastre um e-mail em Minha conta antes de solicitar o código." };
  }

  const passcode = generateOtp();
  const expiresAt = otpExpiry(15);
  await prisma.user.update({
    where: { id: target.id },
    data: { otpHash: await hashSecret(passcode), otpExpiresAt: expiresAt },
  });

  try {
    await sendPasswordOtp({ email: target.contactEmail, passcode, expiresAt });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    console.error("EmailJS:", detail);
    if (detail.includes("non-browser")) {
      return {
        error:
          "O EmailJS bloqueou o envio pelo servidor. Em dashboard.emailjs.com → Account → Security, ative “Allow API requests from non-browser applications” e tente de novo.",
      };
    }
    return { error: "Não foi possível enviar o código. Tente novamente em instantes." };
  }

  return { success: true };
}

export async function changePasswordWithOtp(_: unknown, formData: FormData) {
  const session = await requireSession().catch(() => null);
  const parsed = z
    .object({
      login: z.string().optional(),
      code: z.string().min(4, "Informe o código recebido."),
      next: z.string().min(6, "A nova senha deve ter ao menos 6 caracteres."),
      confirm: z.string().min(1),
    })
    .safeParse({
      login: emptyToNull(formData.get("login")) ?? undefined,
      code: String(formData.get("code") ?? "").trim(),
      next: String(formData.get("next") ?? ""),
      confirm: String(formData.get("confirm") ?? ""),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.next !== parsed.data.confirm) return { error: "A confirmação da senha não confere." };

  const user = parsed.data.login
    ? await findByLogin(parsed.data.login)
    : session?.user?.id
      ? await prisma.user.findUnique({ where: { id: session.user.id } })
      : null;

  if (!user?.otpHash || !user.otpExpiresAt) return { error: "Solicite um código antes de trocar a senha." };
  if (user.otpExpiresAt.getTime() < Date.now()) return { error: "O código expirou. Solicite outro." };
  const ok = await verifySecret(parsed.data.code, user.otpHash);
  if (!ok) return { error: "Código inválido." };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashSecret(parsed.data.next),
      mustChangePassword: false,
      otpHash: null,
      otpExpiresAt: null,
    },
  });
  return { success: true };
}

export async function deleteOwnAccount(_: unknown, formData: FormData) {
  const session = await requireSession();
  const password = String(formData.get("password") ?? "");
  if (!password) return { error: "Informe a senha para confirmar a exclusão." };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Conta não encontrada." };
  const valid = await verifySecret(password, user.passwordHash);
  if (!valid) return { error: "Senha inválida." };

  if (user.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) return { error: "Não é possível excluir o último administrador." };
  }

  await prisma.user.delete({ where: { id: user.id } });
  return { success: true };
}
