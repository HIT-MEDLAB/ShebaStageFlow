-- AlterTable
ALTER TABLE "Holiday" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SoftConstraint" ADD COLUMN     "departmentId" INTEGER,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "universityId" INTEGER;

-- AddForeignKey
ALTER TABLE "SoftConstraint" ADD CONSTRAINT "SoftConstraint_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftConstraint" ADD CONSTRAINT "SoftConstraint_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
