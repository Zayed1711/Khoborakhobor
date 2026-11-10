-- AI summary and fact card per story, checked against the article text
CREATE TABLE "ArticleFacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "model" TEXT,
    "summary" TEXT,
    "who" TEXT,
    "what" TEXT,
    "whenText" TEXT,
    "whereText" TEXT,
    "numbers" TEXT,
    "gkCategory" TEXT,
    "examScore" INTEGER,
    "problems" TEXT,
    "calls" INTEGER NOT NULL DEFAULT 0,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArticleFacts_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ArticleFacts_articleId_key" ON "ArticleFacts"("articleId");
CREATE INDEX "ArticleFacts_createdAt_idx" ON "ArticleFacts"("createdAt");
