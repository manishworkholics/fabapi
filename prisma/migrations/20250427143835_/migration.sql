/*
  Warnings:

  - Made the column `description` on table `Quote` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title` on table `Quote` required. This step will fail if there are existing NULL values in that column.
  - Made the column `turnTime` on table `Quote` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Quote" ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "turnTime" SET NOT NULL;
