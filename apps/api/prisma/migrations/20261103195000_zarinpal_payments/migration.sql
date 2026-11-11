ALTER TABLE "Payment"
ADD COLUMN "providerAuthority" VARCHAR(36);

CREATE UNIQUE INDEX "Payment_providerAuthority_key"
ON "Payment"("providerAuthority");
