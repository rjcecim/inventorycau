import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { MinhaConta } from "@/components/MinhaConta";

export const dynamic = "force-dynamic";

export default async function ContaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <>
      <PageHeader
        title="Minha conta"
        description="Atualize seus dados, troque a senha com um código enviado por e-mail ou exclua a conta."
      />
      <MinhaConta
        fullName={user.fullName}
        login={user.email}
        contactEmail={user.contactEmail}
        role={user.role}
      />
    </>
  );
}
