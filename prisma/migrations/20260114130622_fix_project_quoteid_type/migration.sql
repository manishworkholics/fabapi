-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_quoteId_fkey";

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "quoteId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("quoteId") ON DELETE RESTRICT ON UPDATE CASCADE;
