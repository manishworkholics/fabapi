/*
  Warnings:

  - Made the column `assignedEMSId` on table `Quote` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_assignedEMSId_fkey";

-- AlterTable
ALTER TABLE "Quote" ALTER COLUMN "assignedEMSId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_assignedEMSId_fkey" FOREIGN KEY ("assignedEMSId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
