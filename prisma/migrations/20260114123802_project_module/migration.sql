-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'MANUFACTURING', 'ON_HOLD', 'COMPLETED');

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "pmId" INTEGER NOT NULL,
    "emsId" INTEGER NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ASSIGNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectStatusHistory" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "status" "ProjectStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_quoteId_key" ON "Project"("quoteId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_pmId_fkey" FOREIGN KEY ("pmId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_emsId_fkey" FOREIGN KEY ("emsId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStatusHistory" ADD CONSTRAINT "ProjectStatusHistory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
