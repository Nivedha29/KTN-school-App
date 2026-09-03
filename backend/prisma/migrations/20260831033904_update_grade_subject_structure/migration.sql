/*
  Warnings:

  - You are about to drop the column `classroomId` on the `Enrollment` table. All the data in the column will be lost.
  - You are about to drop the `Classroom` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[studentId,gradeId]` on the table `Enrollment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gradeId` to the `Enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Classroom" DROP CONSTRAINT "Classroom_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_classroomId_fkey";

-- DropIndex
DROP INDEX "Enrollment_studentId_classroomId_key";

-- AlterTable
ALTER TABLE "Enrollment" DROP COLUMN "classroomId",
ADD COLUMN     "gradeId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Classroom";

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "gradeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectTeacher" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraClass" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "academicYearId" INTEGER NOT NULL,
    "teacherId" INTEGER,
    "dayOfWeek" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraClassEnrollment" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "extraClassId" INTEGER NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraClassEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_gradeId_key" ON "Subject"("name", "gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectTeacher_subjectId_teacherId_key" ON "SubjectTeacher"("subjectId", "teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "ExtraClass_name_academicYearId_key" ON "ExtraClass"("name", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "ExtraClassEnrollment_studentId_extraClassId_key" ON "ExtraClassEnrollment"("studentId", "extraClassId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_gradeId_key" ON "Enrollment"("studentId", "gradeId");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectTeacher" ADD CONSTRAINT "SubjectTeacher_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectTeacher" ADD CONSTRAINT "SubjectTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraClass" ADD CONSTRAINT "ExtraClass_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraClass" ADD CONSTRAINT "ExtraClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraClassEnrollment" ADD CONSTRAINT "ExtraClassEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraClassEnrollment" ADD CONSTRAINT "ExtraClassEnrollment_extraClassId_fkey" FOREIGN KEY ("extraClassId") REFERENCES "ExtraClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
