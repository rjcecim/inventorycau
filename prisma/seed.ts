import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminExists = await prisma.user.findUnique({ where: { email: "admin" } });
  if (adminExists) return;

  await prisma.user.create({
    data: {
      email: "admin",
      fullName: "Administrador",
      passwordHash: await bcrypt.hash("admin", 12),
      role: Role.ADMIN,
    },
  });
}

main().finally(() => prisma.$disconnect());
