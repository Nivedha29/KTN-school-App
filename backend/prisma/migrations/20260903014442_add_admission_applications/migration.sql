-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "AdmissionApplication" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "parentId" INTEGER NOT NULL,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedById" INTEGER,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdmissionApplication_studentId_idx" ON "AdmissionApplication"("studentId");

-- CreateIndex
CREATE INDEX "AdmissionApplication_parentId_idx" ON "AdmissionApplication"("parentId");

-- CreateIndex
CREATE INDEX "AdmissionApplication_status_idx" ON "AdmissionApplication"("status");

-- CreateIndex
CREATE INDEX "AdmissionApplication_reviewedById_idx" ON "AdmissionApplication"("reviewedById");

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
