/*
  Warnings:

  - A unique constraint covering the columns `[ingestionJobId]` on the table `Quote` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "QuoteType" ADD VALUE 'QUICK_QUOTE';

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "ingestionJobId" TEXT;

-- CreateTable
CREATE TABLE "IngestionJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "s3Bucket" TEXT,
    "s3Key" TEXT,
    "sizeBytes" BIGINT,
    "sha256" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestionJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IngestionJob_userId_createdAt_idx" ON "IngestionJob"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_ingestionJobId_key" ON "Quote"("ingestionJobId");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_ingestionJobId_fkey" FOREIGN KEY ("ingestionJobId") REFERENCES "IngestionJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
