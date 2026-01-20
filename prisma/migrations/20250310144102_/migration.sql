-- CreateEnum
CREATE TYPE "ProfileJobRole" AS ENUM ('DESIGN ENGINEER', 'PURCHASING ENGINEER', 'CONTRACT MANUFACTURER', 'ELECTRONIC MANUFACTURING SERVICE');

-- CreateEnum
CREATE TYPE "ProjectBuildType" AS ENUM ('PCB ASSEMBLY');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "jobRole" "UserRole",
ADD COLUMN     "projectBuildType" "ProjectBuildType";
