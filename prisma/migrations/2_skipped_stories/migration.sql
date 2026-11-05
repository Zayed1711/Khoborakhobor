-- CreateTable
CREATE TABLE "SkippedStory" (
    "url" TEXT NOT NULL PRIMARY KEY,
    "day" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "SkippedStory_day_idx" ON "SkippedStory"("day");

