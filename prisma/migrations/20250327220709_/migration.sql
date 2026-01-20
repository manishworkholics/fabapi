/*
  Warnings:

  - You are about to drop the `EMSBid` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EMSBid" DROP CONSTRAINT "EMSBid_bidderId_fkey";

-- DropForeignKey
ALTER TABLE "EMSBid" DROP CONSTRAINT "EMSBid_quoteId_fkey";

-- DropTable
DROP TABLE "EMSBid";

-- CreateTable
CREATE TABLE "QuoteEMSBid" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "bidderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteEMSBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteNDA" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "signedNDA" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteNDA_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuoteNDA_quoteId_userId_key" ON "QuoteNDA"("quoteId", "userId");

-- AddForeignKey
ALTER TABLE "QuoteEMSBid" ADD CONSTRAINT "QuoteEMSBid_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteEMSBid" ADD CONSTRAINT "QuoteEMSBid_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteNDA" ADD CONSTRAINT "QuoteNDA_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteNDA" ADD CONSTRAINT "QuoteNDA_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
