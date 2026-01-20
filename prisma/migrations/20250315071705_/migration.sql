/*
  Warnings:

  - You are about to drop the column `quotePart` on the `Quote` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[assignedEMSId]` on the table `Quote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `quoteMaterials` to the `Quote` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'ASSIGNED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "quotePart",
ADD COLUMN     "isDisabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quoteMaterials" BOOLEAN NOT NULL,
ADD COLUMN     "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "assignedEMSId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Quote_assignedEMSId_key" ON "Quote"("assignedEMSId");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_assignedEMSId_fkey" FOREIGN KEY ("assignedEMSId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
