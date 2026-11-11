ALTER TABLE "User"
  ALTER COLUMN "email" DROP NOT NULL,
  ALTER COLUMN "passwordHash" DROP NOT NULL;

ALTER TABLE "User"
  ADD COLUMN "phone" VARCHAR(16);

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

CREATE TYPE "SmsOtpPurpose" AS ENUM ('LOGIN', 'REGISTER');

CREATE TABLE "SmsOtpChallenge" (
  "id" UUID NOT NULL,
  "phone" VARCHAR(16) NOT NULL,
  "codeHash" VARCHAR(64) NOT NULL,
  "purpose" "SmsOtpPurpose" NOT NULL,
  "name" VARCHAR(160),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "consumedAt" TIMESTAMPTZ(3),
  CONSTRAINT "SmsOtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SmsOtpChallenge_phone_key" ON "SmsOtpChallenge"("phone");
CREATE INDEX "SmsOtpChallenge_expiresAt_idx" ON "SmsOtpChallenge"("expiresAt");
