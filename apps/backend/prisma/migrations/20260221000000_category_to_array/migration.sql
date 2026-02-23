-- AlterTable: Convert category from VARCHAR(50) to TEXT[]
-- Step 1: Add a temporary column
ALTER TABLE "jobs" ADD COLUMN "category_new" TEXT[];

-- Step 2: Migrate existing data (single string -> array with one element)
UPDATE "jobs" SET "category_new" = ARRAY["category"];

-- Step 3: Drop old column and rename new one
ALTER TABLE "jobs" DROP COLUMN "category";
ALTER TABLE "jobs" RENAME COLUMN "category_new" TO "category";

-- Step 4: Set NOT NULL constraint
ALTER TABLE "jobs" ALTER COLUMN "category" SET NOT NULL;

-- Step 5: Recreate index for array column using GIN
DROP INDEX IF EXISTS "jobs_category_idx";
CREATE INDEX "jobs_category_idx" ON "jobs" USING GIN ("category");
