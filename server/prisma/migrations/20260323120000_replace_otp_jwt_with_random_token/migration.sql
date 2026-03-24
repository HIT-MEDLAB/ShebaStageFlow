-- AlterTable: add token column (nullable first for existing rows)
ALTER TABLE "OtpCode" ADD COLUMN "token" TEXT;

-- Backfill existing rows with unique random tokens
UPDATE "OtpCode" SET "token" = gen_random_uuid()::text WHERE "token" IS NULL;

-- Make token NOT NULL and add unique constraint
ALTER TABLE "OtpCode" ALTER COLUMN "token" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OtpCode_token_key" ON "OtpCode"("token");
