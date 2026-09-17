-- Agrupamento horizontal por group_id compartilhado (sem entidade de estação).
ALTER TABLE "computadores" ADD COLUMN IF NOT EXISTS "group_id" TEXT;
ALTER TABLE "monitores" ADD COLUMN IF NOT EXISTS "group_id" TEXT;
CREATE INDEX IF NOT EXISTS "computadores_group_id_idx" ON "computadores"("group_id");
CREATE INDEX IF NOT EXISTS "monitores_group_id_idx" ON "monitores"("group_id");

DO $$
DECLARE
  r RECORD;
  gid TEXT;
  monitor_count INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monitores' AND column_name = 'computador_id'
  ) THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT c.id AS computer_id, c.deleted_at, array_agg(m.id) FILTER (WHERE m.deleted_at IS NULL) AS monitor_ids
    FROM computadores c
    JOIN monitores m ON m.computador_id = c.id
    GROUP BY c.id, c.deleted_at
  LOOP
    monitor_count := COALESCE(array_length(r.monitor_ids, 1), 0);
    IF (r.deleted_at IS NULL AND monitor_count >= 1) OR (r.deleted_at IS NOT NULL AND monitor_count >= 2) THEN
      gid := gen_random_uuid()::text;
      IF r.deleted_at IS NULL THEN
        UPDATE computadores SET group_id = gid WHERE id = r.computer_id AND group_id IS NULL;
      END IF;
      UPDATE monitores SET group_id = gid WHERE id = ANY (r.monitor_ids) AND group_id IS NULL;
    END IF;
  END LOOP;
END $$;

ALTER TABLE "monitores" DROP CONSTRAINT IF EXISTS "monitores_computador_id_fkey";
DROP INDEX IF EXISTS "monitores_computador_id_idx";
ALTER TABLE "monitores" DROP COLUMN IF EXISTS "computador_id";
