/*
  Warnings:

  - You are about to drop the column `EMSAvailability` on the `Profile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EMSAvailabilityStatus" AS ENUM ('ACTIVE', 'OPEN', 'NOT_AVAILABLE');

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "EMSAvailability",
ADD COLUMN     "EMSAvailabilityStatus" "EMSAvailabilityStatus" NOT NULL DEFAULT 'OPEN';
