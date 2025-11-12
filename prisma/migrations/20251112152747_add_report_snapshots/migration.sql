-- CreateTable
CREATE TABLE "report_snapshots" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "data" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_snapshots_type_createdAt_idx" ON "report_snapshots"("type", "createdAt");
