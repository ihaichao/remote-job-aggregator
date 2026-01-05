-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "company" VARCHAR(255) NOT NULL,
    "company_logo" VARCHAR(500),
    "category" VARCHAR(50) NOT NULL,
    "tags" TEXT[],
    "region_limit" VARCHAR(50) NOT NULL,
    "location_detail" TEXT,
    "work_type" VARCHAR(50) NOT NULL,
    "salary_currency" VARCHAR(10),
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "salary_period" VARCHAR(20),
    "source_site" VARCHAR(50) NOT NULL,
    "original_url" TEXT NOT NULL,
    "content_hash" VARCHAR(64) NOT NULL,
    "description" TEXT,
    "date_posted" TIMESTAMP(3),
    "date_scraped" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scraper_logs" (
    "id" SERIAL NOT NULL,
    "source_site" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "jobs_scraped" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "scraper_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jobs_original_url_key" ON "jobs"("original_url");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_content_hash_key" ON "jobs"("content_hash");

-- CreateIndex
CREATE INDEX "jobs_category_idx" ON "jobs"("category");

-- CreateIndex
CREATE INDEX "jobs_region_limit_idx" ON "jobs"("region_limit");

-- CreateIndex
CREATE INDEX "jobs_work_type_idx" ON "jobs"("work_type");

-- CreateIndex
CREATE INDEX "jobs_date_posted_idx" ON "jobs"("date_posted" DESC);

-- CreateIndex
CREATE INDEX "jobs_is_active_idx" ON "jobs"("is_active");
