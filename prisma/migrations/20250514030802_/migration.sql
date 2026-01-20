/*
  Warnings:

  - A unique constraint covering the columns `[quoteId]` on the table `Quote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `quoteId` to the `Quote` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "QuoteEMSBid" DROP CONSTRAINT "QuoteEMSBid_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "QuoteNDA" DROP CONSTRAINT "QuoteNDA_quoteId_fkey";

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "quoteId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteId_key" ON "Quote"("quoteId");

-- AddForeignKey
ALTER TABLE "QuoteEMSBid" ADD CONSTRAINT "QuoteEMSBid_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("quoteId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteNDA" ADD CONSTRAINT "QuoteNDA_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("quoteId") ON DELETE CASCADE ON UPDATE CASCADE;
