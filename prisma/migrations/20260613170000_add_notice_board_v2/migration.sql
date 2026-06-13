-- CreateEnum
CREATE TYPE "NoticeCategory" AS ENUM ('GENERAL', 'ACADEMIC', 'EVENT', 'URGENT', 'FEE_RELATED', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "NoticePriority" AS ENUM ('NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NoticeTarget" AS ENUM ('ALL_STUDENTS', 'ALL_TEACHERS', 'ALL_PARENTS', 'SPECIFIC_CLASS', 'EVERYONE');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'NOTICE';

-- AlterTable
ALTER TABLE "Notice" DROP COLUMN "audience",
DROP COLUMN "isActive",
DROP COLUMN "postedBy",
ADD COLUMN     "category" "NoticeCategory" NOT NULL,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "createdByRole" TEXT NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" "NoticePriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "targetAudience" "NoticeTarget" NOT NULL,
ADD COLUMN     "targetClassId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Notice_targetAudience_idx" ON "Notice"("targetAudience");

-- CreateIndex
CREATE INDEX "Notice_targetClassId_idx" ON "Notice"("targetClassId");

-- CreateIndex
CREATE INDEX "Notice_createdById_idx" ON "Notice"("createdById");

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_targetClassId_fkey" FOREIGN KEY ("targetClassId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
