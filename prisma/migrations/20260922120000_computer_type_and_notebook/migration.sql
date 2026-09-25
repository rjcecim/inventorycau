-- CreateEnum
CREATE TYPE "ComputerType" AS ENUM ('DESKTOP', 'NOTEBOOK');

-- AlterEnum
ALTER TYPE "AssetKind" ADD VALUE 'NOTEBOOK';

-- AlterTable
ALTER TABLE "computadores" ADD COLUMN "tipo" "ComputerType" NOT NULL DEFAULT 'DESKTOP';

-- CreateIndex
CREATE INDEX "computadores_tipo_idx" ON "computadores"("tipo");
