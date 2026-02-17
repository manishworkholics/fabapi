-- CreateEnum
CREATE TYPE "BomSource" AS ENUM ('DIGIKEY', 'MOUSER');

-- CreateEnum
CREATE TYPE "LookupStatus" AS ENUM ('PENDING', 'FOUND', 'NOT_FOUND', 'BACKORDER', 'OBSOLETE', 'ERROR');

-- CreateTable
CREATE TABLE "BomUpload" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "columnMapping" JSONB,
    "buildQuantities" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BomUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BomRow" (
    "id" SERIAL NOT NULL,
    "uploadId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "mpns" VARCHAR(255)[],
    "manufacturer" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BomRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BomLookup" (
    "id" SERIAL NOT NULL,
    "rowId" INTEGER NOT NULL,
    "source" "BomSource" NOT NULL,
    "mpn" TEXT NOT NULL,
    "status" "LookupStatus" NOT NULL DEFAULT 'PENDING',
    "quantityAvailable" INTEGER,
    "scaledPriceBands" JSONB,
    "requestJson" JSONB NOT NULL,
    "responseJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BomLookup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BomRow_uploadId_rowIndex_key" ON "BomRow"("uploadId", "rowIndex");

-- CreateIndex
CREATE UNIQUE INDEX "BomLookup_rowId_source_mpn_key" ON "BomLookup"("rowId", "source", "mpn");

-- AddForeignKey
ALTER TABLE "BomUpload" ADD CONSTRAINT "BomUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomRow" ADD CONSTRAINT "BomRow_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "BomUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomLookup" ADD CONSTRAINT "BomLookup_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "BomRow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
