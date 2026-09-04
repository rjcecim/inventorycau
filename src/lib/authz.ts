import { auth } from "@/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") {
    throw new Error("Permissão negada. Apenas administradores.");
  }
  return session;
}

export function isAdminRole(role?: string | null) {
  return role === "ADMIN";
}
