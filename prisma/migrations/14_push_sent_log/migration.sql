-- Which reminder kinds a device already got today (at most 2 a day, none twice)
ALTER TABLE "PushDevice" ADD COLUMN "sentDay" TEXT;
ALTER TABLE "PushDevice" ADD COLUMN "sentKinds" TEXT NOT NULL DEFAULT '';
