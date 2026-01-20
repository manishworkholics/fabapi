/*
  Warnings:

  - The values [DESIGN ENGINEER,PURCHASING ENGINEER,CONTRACT MANUFACTURER,ELECTRONIC MANUFACTURING SERVICE] on the enum `ProfileJobRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [PCB ASSEMBLY] on the enum `ProjectBuildType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProfileJobRole_new" AS ENUM ('DESIGN_ENGINEER', 'PURCHASING_ENGINEER', 'CONTRACT_MANUFACTURER', 'ELECTRONIC_MANUFACTURING_SERVICE');
ALTER TABLE "Profile" ALTER COLUMN "jobRole" TYPE "ProfileJobRole_new" USING ("jobRole"::text::"ProfileJobRole_new");
ALTER TYPE "ProfileJobRole" RENAME TO "ProfileJobRole_old";
ALTER TYPE "ProfileJobRole_new" RENAME TO "ProfileJobRole";
DROP TYPE "ProfileJobRole_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProjectBuildType_new" AS ENUM ('PCB');
ALTER TABLE "Profile" ALTER COLUMN "projectBuildType" TYPE "ProjectBuildType_new" USING ("projectBuildType"::text::"ProjectBuildType_new");
ALTER TYPE "ProjectBuildType" RENAME TO "ProjectBuildType_old";
ALTER TYPE "ProjectBuildType_new" RENAME TO "ProjectBuildType";
DROP TYPE "ProjectBuildType_old";
COMMIT;
