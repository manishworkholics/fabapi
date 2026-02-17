-- DropIndex
DROP INDEX "Quote_userId_key";

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_assignedEMSId_fkey" FOREIGN KEY ("assignedEMSId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
