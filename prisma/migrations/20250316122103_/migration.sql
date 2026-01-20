/*
  Warnings:

  - You are about to drop the column `isArchive` on the `Quote` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "isArchive",
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;
