/*
  Warnings:

  - The `turnTime` column on the `Quote` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TurnTime" AS ENUM ('ONE_TO_THREE_DAYS', 'UP_TO_FIVE_DAYS', 'UP_TO_TEN_DAYS');

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "turnTime",
ADD COLUMN     "turnTime" "TurnTime" NOT NULL DEFAULT 'ONE_TO_THREE_DAYS';
