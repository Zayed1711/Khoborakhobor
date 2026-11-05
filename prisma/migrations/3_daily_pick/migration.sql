-- Add the dailyPick flag (one column; no table rebuild needed)
ALTER TABLE "Article" ADD COLUMN "dailyPick" BOOLEAN NOT NULL DEFAULT false;
