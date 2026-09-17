import { PrismaClient } from "@prisma/client";
import { planGroupMigration } from "../src/lib/equipamento-grupo";

const prisma = new PrismaClient();

async function columnExists(table: string, column: string) {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = ${table} AND column_name = ${column}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function main() {
  await prisma.$executeRaw`ALTER TABLE "computadores" ADD COLUMN IF NOT EXISTS "group_id" TEXT`;
  await prisma.$executeRaw`ALTER TABLE "monitores" ADD COLUMN IF NOT EXISTS "group_id" TEXT`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "computadores_group_id_idx" ON "computadores"("group_id")`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "monitores_group_id_idx" ON "monitores"("group_id")`;

  if (!(await columnExists("monitores", "computador_id"))) {
    console.log("migrate-groups: computador_id já removido, nada a converter.");
    return;
  }

  const computers = await prisma.$queryRaw<Array<{ id: string; deleted_at: Date | null }>>`
    SELECT id, deleted_at FROM computadores
  `;
  const monitors = await prisma.$queryRaw<Array<{ id: string; computador_id: string | null; deleted_at: Date | null }>>`
    SELECT id, computador_id, deleted_at FROM monitores
  `;

  const byComputer = new Map<string, string[]>();
  for (const monitor of monitors.filter((item) => !item.deleted_at && item.computador_id)) {
    const list = byComputer.get(monitor.computador_id as string) ?? [];
    list.push(monitor.id);
    byComputer.set(monitor.computador_id as string, list);
  }

  const computerById = new Map(computers.map((item) => [item.id, item]));
  const links = [...byComputer.entries()].map(([computerId, monitorIds]) => ({
    computerId,
    computerActive: !computerById.get(computerId)?.deleted_at,
    monitorIds,
  }));

  const groups = planGroupMigration(links);
  for (const group of groups) {
    if (group.computerId) {
      await prisma.$executeRaw`UPDATE computadores SET group_id = ${group.groupId} WHERE id = ${group.computerId} AND group_id IS NULL`;
    }
    for (const monitorId of group.monitorIds) {
      await prisma.$executeRaw`UPDATE monitores SET group_id = ${group.groupId} WHERE id = ${monitorId} AND group_id IS NULL`;
    }
  }

  console.log(`migrate-groups: ${groups.length} agrupamento(s) convertidos de computador_id.`);

  await prisma.$executeRaw`ALTER TABLE "monitores" DROP CONSTRAINT IF EXISTS "monitores_computador_id_fkey"`;
  await prisma.$executeRaw`DROP INDEX IF EXISTS "monitores_computador_id_idx"`;
  await prisma.$executeRaw`ALTER TABLE "monitores" DROP COLUMN IF EXISTS "computador_id"`;
  console.log("migrate-groups: coluna computador_id removida.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
