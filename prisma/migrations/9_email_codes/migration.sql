-- Email codes for sign-up verification and "forgot password"
CREATE TABLE "EmailCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "EmailCode_email_purpose_createdAt_idx" ON "EmailCode"("email", "purpose", "createdAt");

-- Students: email verified by a code. Accounts made before email codes existed count as verified.
ALTER TABLE "Student" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Student" SET "emailVerified" = true;
