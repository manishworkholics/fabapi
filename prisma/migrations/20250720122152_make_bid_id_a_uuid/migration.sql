/*
  Warnings:

  - The primary key for the `QuoteEMSBid` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "QuoteEMSBid" DROP CONSTRAINT "QuoteEMSBid_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "QuoteEMSBid_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "QuoteEMSBid_id_seq";
