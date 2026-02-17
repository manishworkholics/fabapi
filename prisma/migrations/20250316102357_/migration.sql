-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_assignedEMSId_fkey";

-- AlterTable
ALTER TABLE "Quote" ALTER COLUMN "assignedEMSId" DROP NOT NULL;
