-- CreateEnum
CREATE TYPE "QuoteBidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "QuoteEMSBid" ADD COLUMN     "status" "QuoteBidStatus" NOT NULL DEFAULT 'PENDING';
