import { AssetStatus, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SETORES, setorNivel } from "./setores";

const prisma = new PrismaClient();

function splitModel(modelo?: string | null) {
  if (!modelo) return { fabricante: null as string | null, modelo: null as string | null };
  const known = ["Dell", "HP", "LG", "Lenovo", "Samsung", "AOC", "Positivo", "Apple"];
  const found = known.find((brand) => modelo.toLowerCase().startsWith(brand.toLowerCase()));
  if (found) {
    return { fabricante: found, modelo: modelo.slice(found.length).trim() || modelo };
  }
  return { fabricante: null, modelo };
}

async function syncSetores() {
  const byCodigo = new Map<string, string>();

  // 1ª passagem: cria/atualiza setores sem parent
  for (const [index, setor] of SETORES.entries()) {
    const row = await prisma.departamento.upsert({
      where: { codigo: setor.codigo },
      update: {
        nome: setor.nome,
        qtdServidores: setor.qtdServidores,
        nivel: setorNivel(setor.codigo),
        sortOrder: index,
      },
      create: {
        codigo: setor.codigo,
        nome: setor.nome,
        qtdServidores: setor.qtdServidores,
        nivel: setorNivel(setor.codigo),
        sortOrder: index,
      },
    });
    byCodigo.set(setor.codigo, row.id);
  }

  // 2ª passagem: liga pais
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
    await prisma.alocacao.deleteMany({ where: { departamentoId: orphan.id } });
    await prisma.departamento.delete({ where: { id: orphan.id } });
  }

  return byCodigo;
}

async function main() {
  const passwordHash = await bcrypt.hash("admin", 12);
  await prisma.user.upsert({
    where: { email: "admin" },
    update: { passwordHash, role: Role.ADMIN, fullName: "Administrador" },
    create: { email: "admin", fullName: "Administrador", passwordHash, role: Role.ADMIN },
  });
  await prisma.user.deleteMany({ where: { email: { not: "admin" } } });

  const setores = await syncSetores();
  const stiId = setores.get("9.2"); // Secretaria de Tecnologia da Informação
  const apoioUsuarioId = setores.get("9.2.5");

  const locationNames = [
    { id: "sede-geral", nome: "Sede — Belém", predio: "Sede", andar: null, sala: null },
    { id: "estoque", nome: "Estoque / Reserva", predio: "Sede", andar: "Térreo", sala: "Depósito" },
    { id: "santarem", nome: "Unidade Regional — Santarém", predio: "URR Santarém", andar: null, sala: null },
    { id: "maraba", nome: "Unidade Regional — Marabá", predio: "URR Marabá", andar: null, sala: null },
  ];
  for (const loc of locationNames) {
    await prisma.localizacao.upsert({
      where: { id: loc.id },
      update: { nome: loc.nome, predio: loc.predio, andar: loc.andar, sala: loc.sala },
      create: loc,
    });
  }

  // Remove localizações fictícias antigas
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

  for (let index = 1; index <= 10; index++) {
    const modeloCompleto = index % 2 ? "Dell OptiPlex 7010" : "HP ProDesk 600 G5";
    const { fabricante, modelo } = splitModel(modeloCompleto);
    await prisma.computador.upsert({
      where: { tombo: `PC-${String(index).padStart(4, "0")}` },
      update: {},
      create: {
        tombo: `PC-${String(index).padStart(4, "0")}`,
        hostname: `TCE-PC-${String(index).padStart(4, "0")}`,
        fabricante,
        modelo,
        status: AssetStatus.AVAILABLE,
      },
    });
  }

  for (let index = 1; index <= 15; index++) {
    const modeloCompleto = index % 2 ? "Dell P2422H" : "LG 24MP400";
    const { fabricante, modelo } = splitModel(modeloCompleto);
    await prisma.monitor.upsert({
      where: { tombo: `MON-${String(index).padStart(4, "0")}` },
      update: {},
      create: {
        tombo: `MON-${String(index).padStart(4, "0")}`,
        fabricante,
        modelo,
        tamanho: "24\"",
        resolucao: "1920x1080",
        status: AssetStatus.AVAILABLE,
      },
    });
  }

  const demoDeptId = apoioUsuarioId ?? stiId;
  if (demoDeptId) {
    const samplePeople = [
      { nome: "Ana Souza", matricula: "1001", cargo: "Analista de TI" },
      { nome: "Bruno Lima", matricula: "1002", cargo: "Técnico de Suporte" },
      { nome: "Carla Mendes", matricula: "1003", cargo: "Analista de Sistemas" },
      { nome: "Diego Alves", matricula: "1004", cargo: "Estagiário" },
    ];
    const people = [];
    for (const person of samplePeople) {
      people.push(
        await prisma.servidor.upsert({
          where: { matricula: person.matricula },
          update: { nome: person.nome, cargo: person.cargo, departamentoId: demoDeptId, ativo: true },
          create: { ...person, departamentoId: demoDeptId, ativo: true },
        }),
      );
    }

    const computers = await prisma.computador.findMany({ take: 4, orderBy: { tombo: "asc" } });
    const monitors = await prisma.monitor.findMany({ take: 4, orderBy: { tombo: "asc" } });

    for (let index = 0; index < computers.length; index++) {
      await prisma.computador.update({
        where: { id: computers[index].id },
        data: {
          departamentoId: demoDeptId,
          servidorId: people[index]?.id,
          usuario: people[index]?.nome,
          status: AssetStatus.IN_USE,
          localizacaoId: "sede-geral",
          hostname: computers[index].hostname ?? `TCE-${computers[index].tombo}`,
        },
      });
      if (monitors[index]) {
        await prisma.monitor.update({
          where: { id: monitors[index].id },
          data: {
            computadorId: computers[index].id,
            departamentoId: demoDeptId,
            servidorId: people[index]?.id,
            usuario: people[index]?.nome,
            status: AssetStatus.IN_USE,
            localizacaoId: "sede-geral",
          },
        });
      }
    }

    await prisma.alocacao.deleteMany({});
    for (let index = 0; index < computers.length; index++) {
      await prisma.alocacao.create({
        data: {
          departamentoId: demoDeptId,
          computadorId: computers[index].id,
          usuario: people[index]?.nome,
          monitores: monitors[index]
            ? { create: { monitorId: monitors[index].id, ordem: 1 } }
            : undefined,
        },
      });
    }
  }

  const remainingComputers = await prisma.computador.findMany({ where: { fabricante: null, modelo: { not: null } } });
  for (const computer of remainingComputers) {
    const parsed = splitModel(computer.modelo);
    if (parsed.fabricante) {
      await prisma.computador.update({
        where: { id: computer.id },
        data: { fabricante: parsed.fabricante, modelo: parsed.modelo, hostname: computer.hostname ?? `TCE-${computer.tombo}` },
      });
    }
  }

  const remainingMonitors = await prisma.monitor.findMany({ where: { fabricante: null, modelo: { not: null } } });
  for (const monitor of remainingMonitors) {
    const parsed = splitModel(monitor.modelo);
    if (parsed.fabricante) {
      await prisma.monitor.update({
        where: { id: monitor.id },
        data: { fabricante: parsed.fabricante, modelo: parsed.modelo },
      });
    }
  }
}

main().finally(() => prisma.$disconnect());
