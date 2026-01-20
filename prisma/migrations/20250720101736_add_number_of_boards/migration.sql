-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "numberOfBoards" TEXT[] DEFAULT ARRAY[]::TEXT[];
