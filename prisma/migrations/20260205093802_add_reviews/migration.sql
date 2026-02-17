-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "pmId" INTEGER NOT NULL,
    "emsId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_emsId_idx" ON "Review"("emsId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_pmId_fkey" FOREIGN KEY ("pmId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_emsId_fkey" FOREIGN KEY ("emsId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
