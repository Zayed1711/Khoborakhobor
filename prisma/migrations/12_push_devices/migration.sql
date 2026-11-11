-- Phones/browsers that allowed notifications (web push)
CREATE TABLE "PushDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "studentId" TEXT,
    "reminderHour" INTEGER NOT NULL DEFAULT 20,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "PushDevice_endpoint_key" ON "PushDevice"("endpoint");
CREATE INDEX "PushDevice_studentId_idx" ON "PushDevice"("studentId");
CREATE INDEX "PushDevice_enabled_reminderHour_idx" ON "PushDevice"("enabled", "reminderHour");
