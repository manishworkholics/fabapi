-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "employeeRange" TEXT,
ADD COLUMN     "equipmentList" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "establishedYear" INTEGER,
ADD COLUMN     "facilityVideoUrl" TEXT,
ADD COLUMN     "manufacturingCapabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "projectsCompleted" INTEGER DEFAULT 0,
ADD COLUMN     "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptTerms" BOOLEAN NOT NULL DEFAULT false;
