/*
  Warnings:

  - The `quoteMaterials` column on the `Quote` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "quoteMaterials",
ADD COLUMN     "quoteMaterials" TEXT[];
