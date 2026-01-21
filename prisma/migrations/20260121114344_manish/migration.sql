-- CreateTable
CREATE TABLE "FavoriteQuote" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "quoteId" TEXT NOT NULL,

    CONSTRAINT "FavoriteQuote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteQuote_userId_quoteId_key" ON "FavoriteQuote"("userId", "quoteId");

-- AddForeignKey
ALTER TABLE "FavoriteQuote" ADD CONSTRAINT "FavoriteQuote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteQuote" ADD CONSTRAINT "FavoriteQuote_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("quoteId") ON DELETE CASCADE ON UPDATE CASCADE;
