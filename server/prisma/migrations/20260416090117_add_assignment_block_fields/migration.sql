-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "groupIndex" INTEGER;

-- CreateIndex
CREATE INDEX "Assignment_groupId_idx" ON "Assignment"("groupId");
