-- CreateTable
CREATE TABLE "WritingSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "articleId" TEXT,
    "articleSlug" TEXT NOT NULL,
    "articleTitle" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "feedback" TEXT,
    "band" REAL,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WritingSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WritingSubmission_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WritingSubmission_status_createdAt_idx" ON "WritingSubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WritingSubmission_studentId_idx" ON "WritingSubmission"("studentId");

