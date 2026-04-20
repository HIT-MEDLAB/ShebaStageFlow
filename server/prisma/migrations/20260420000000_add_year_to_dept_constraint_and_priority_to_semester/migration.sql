-- AlterTable DepartmentConstraint: add year column
ALTER TABLE "DepartmentConstraint" ADD COLUMN "year" INTEGER NOT NULL DEFAULT 2025;

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentConstraint_departmentId_year_key" ON "DepartmentConstraint"("departmentId", "year");

-- AlterTable UniversitySemester: add priority column
ALTER TABLE "UniversitySemester" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
