-- Daily goal ring, XP and streak freeze
CREATE TABLE "DailyProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "stories" INTEGER NOT NULL DEFAULT 0,
    "mcqs" INTEGER NOT NULL DEFAULT 0,
    "mcqsCorrect" INTEGER NOT NULL DEFAULT 0,
    "words" INTEGER NOT NULL DEFAULT 0,
    "lookups" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "goalDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "DailyProgress_studentId_day_key" ON "DailyProgress"("studentId", "day");
CREATE INDEX "DailyProgress_day_idx" ON "DailyProgress"("day");

ALTER TABLE "Student" ADD COLUMN "streakFreezeDay" TEXT;
