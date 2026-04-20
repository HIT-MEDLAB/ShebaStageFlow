-- DropIndex (from previous partial migration)
DROP INDEX IF EXISTS "DepartmentConstraint_departmentId_year_key";

-- AlterTable DepartmentConstraint
-- Step 1: Add new columns (academicYearId nullable initially for backfill)
ALTER TABLE "DepartmentConstraint" ADD COLUMN IF NOT EXISTS "academicYearId" INTEGER;
ALTER TABLE "DepartmentConstraint" ADD COLUMN IF NOT EXISTS "hasMorningShift" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "DepartmentConstraint" ADD COLUMN IF NOT EXISTS "hasEveningShift" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DepartmentConstraint" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Step 2: Backfill academicYearId from 'year' column if it exists, or use latest academic year
DO $$
DECLARE
  latest_year_id INTEGER;
BEGIN
  -- Get the most recent academic year id
  SELECT id INTO latest_year_id FROM "AcademicYear" ORDER BY "startDate" DESC LIMIT 1;

  IF latest_year_id IS NOT NULL THEN
    -- If there's a 'year' column from previous migration, try to match by year name
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'DepartmentConstraint' AND column_name = 'year') THEN
      -- Set academicYearId based on matching year column to academic year start dates
      UPDATE "DepartmentConstraint" dc
      SET "academicYearId" = COALESCE(
        (SELECT ay.id FROM "AcademicYear" ay WHERE EXTRACT(YEAR FROM ay."startDate") = dc."year" LIMIT 1),
        latest_year_id
      )
      WHERE dc."academicYearId" IS NULL;
    ELSE
      -- No year column, just use latest academic year
      UPDATE "DepartmentConstraint" SET "academicYearId" = latest_year_id WHERE "academicYearId" IS NULL;
    END IF;
  END IF;

  -- Backfill shift flags from Department table
  UPDATE "DepartmentConstraint" dc
  SET
    "hasMorningShift" = d."hasMorningShift",
    "hasEveningShift" = d."hasEveningShift"
  FROM "Department" d
  WHERE dc."departmentId" = d.id;
END $$;

-- Step 3: Drop old 'year' column if it exists
ALTER TABLE "DepartmentConstraint" DROP COLUMN IF EXISTS "year";

-- Step 4: Make academicYearId non-nullable (only if there are records)
DO $$
BEGIN
  -- Delete orphaned records that couldn't be assigned an academic year
  DELETE FROM "DepartmentConstraint" WHERE "academicYearId" IS NULL;

  -- Now make it non-nullable
  ALTER TABLE "DepartmentConstraint" ALTER COLUMN "academicYearId" SET NOT NULL;
END $$;

-- Step 5: Create unique index and FK
CREATE UNIQUE INDEX "DepartmentConstraint_departmentId_academicYearId_key" ON "DepartmentConstraint"("departmentId", "academicYearId");
ALTER TABLE "DepartmentConstraint" ADD CONSTRAINT "DepartmentConstraint_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable UniversitySemester - add isActive
ALTER TABLE "UniversitySemester" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Backfill priority on UniversitySemester from University if not already set
-- (priority column was added in previous partial migration)
ALTER TABLE "UniversitySemester" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;

UPDATE "UniversitySemester" us
SET "priority" = u."priority"
FROM "University" u
WHERE us."universityId" = u.id AND us."priority" = 0;
