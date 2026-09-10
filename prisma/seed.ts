import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SETORES, setorNivel } from "./setores";

const prisma = new PrismaClient();

async function syncSetores() {
  const byCodigo = new Map<string, string>();

  for (const [index, setor] of SETORES.entries()) {
    const row = await prisma.departamento.upsert({
      where: { codigo: setor.codigo },
      update: {
        nome: setor.nome,
        nivel: setorNivel(setor.codigo),
        sortOrder: index,
      },
      create: {
        codigo: setor.codigo,
        nome: setor.nome,
        nivel: setorNivel(setor.codigo),
        sortOrder: index,
      },
    });
    byCodigo.set(setor.codigo, row.id);
  }

  for (const setor of SETORES) {
    if (!setor.parentCodigo) continue;
    const id = byCodigo.get(setor.codigo);
    const parentId = byCodigo.get(setor.parentCodigo);
    if (!id || !parentId) continue;
    await prisma.departamento.update({
      where: { id },
      data: { parentId },
    });
  }

  const officialCodes = SETORES.map((s) => s.codigo);
  const orphans = await prisma.departamento.findMany({
    where: { codigo: { notIn: officialCodes } },
  });

  for (const orphan of orphans) {
    await prisma.computador.updateMany({ where: { departamentoId: orphan.id }, data: { departamentoId: null } });
    await prisma.monitor.updateMany({ where: { departamentoId: orphan.id }, data: { departamentoId: null } });
    await prisma.departamento.delete({ where: { id: orphan.id } });
  }

  return byCodigo;
}

async function main() {
  const accounts = [
    { email: "admin", fullName: "Administrador", password: "admin", role: Role.ADMIN },
    { email: "user", fullName: "Usuário", password: "user", role: Role.USER },
  ] as const;

  for (const account of accounts) {
    const passwordHash = await bcrypt.hash(account.password, 12);
    await prisma.user.upsert({
      where: { email: account.email },
      update: { passwordHash, role: account.role, fullName: account.fullName },
      create: {
        email: account.email,
        fullName: account.fullName,
        passwordHash,
        role: account.role,
      },
    });
  }

  await prisma.user.deleteMany({
    where: { email: { notIn: accounts.map((account) => account.email) } },
  });

  await syncSetores();

  const locationNames = [
    { id: "sede-geral", nome: "Sede", cidade: "Belém", uf: "PA" },
    { id: "estoque", nome: "Estoque / Reserva", cidade: "Belém", uf: "PA" },
    { id: "santarem", nome: "Unidade Regional", cidade: "Santarém", uf: "PA" },
    { id: "maraba", nome: "Unidade Regional", cidade: "Marabá", uf: "PA" },
  ];
  for (const loc of locationNames) {
    await prisma.localizacao.upsert({
      where: { id: loc.id },
      update: { nome: loc.nome, cidade: loc.cidade, uf: loc.uf },
      create: loc,
    });
  }

  await prisma.computador.updateMany({
    where: { localizacaoId: { in: ["sede-ti", "sede-adm", "sede-fisc"] } },
    data: { localizacaoId: "sede-geral" },
  });
  await prisma.monitor.updateMany({
    where: { localizacaoId: { in: ["sede-ti", "sede-adm", "sede-fisc"] } },
    data: { localizacaoId: "sede-geral" },
  });
  await prisma.localizacao.deleteMany({
    where: { id: { in: ["sede-ti", "sede-adm", "sede-fisc"] } },
  });
}

main().finally(() => prisma.$disconnect());
