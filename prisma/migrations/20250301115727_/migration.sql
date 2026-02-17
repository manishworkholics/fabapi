/*
  Warnings:

  - The values [EMAIL_VERIFICATOIN] on the enum `OtpType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OtpType_new" AS ENUM ('EMAIL_VERIFICATION', 'RESET_PASSWORD', 'SIGNIN', 'OTHERS');
ALTER TABLE "Otp" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Otp" ALTER COLUMN "type" TYPE "OtpType_new" USING ("type"::text::"OtpType_new");
ALTER TYPE "OtpType" RENAME TO "OtpType_old";
ALTER TYPE "OtpType_new" RENAME TO "OtpType";
DROP TYPE "OtpType_old";
ALTER TABLE "Otp" ALTER COLUMN "type" SET DEFAULT 'OTHERS';
COMMIT;
