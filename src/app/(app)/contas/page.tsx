import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/authz";
import { PageHeader } from "@/components/PageHeader";
import { ContasManager } from "@/components/ContasManager";

export const dynamic = "force-dynamic";

export default async function ContasPage() {
  const session = await auth();
  if (!isAdminRole(session?.user?.role)) redirect("/");

  const accounts = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
    select: {
      id: true,
      email: true,
      fullName: true,
      contactEmail: true,
      role: true,
      mustChangePassword: true,
    },
  });

  return (
    <>
      <PageHeader
        title="Contas"
        description="Crie logins de administrador e usuário. A senha inicial é temporária e obriga a troca no primeiro acesso."
      />
      <ContasManager accounts={accounts} currentUserId={session?.user?.id ?? ""} />
    </>
  );
}
