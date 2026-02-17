/*
  Warnings:

  - Added the required column `message` to the `QuoteEMSBid` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "QuoteEMSBid" ADD COLUMN     "message" TEXT NOT NULL;
