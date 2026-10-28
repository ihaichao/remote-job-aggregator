-- Bring migrations in line with schema.prisma. Production already has these
-- changes (applied by hand), so every statement is idempotent.

-- AlterTable: company is optional (not every source names the employer)
ALTER TABLE "jobs" ALTER COLUMN "company" DROP NOT NULL;

-- AlterTable: direct application link (RWFA / Remote.com)
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "apply_url" TEXT;
