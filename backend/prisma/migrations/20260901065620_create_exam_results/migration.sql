-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('SEMESTER_1', 'ANNUAL');

-- CreateTable
CREATE TABLE "Exam" (
    "id" SERIAL NOT NULL,
    "examType" "ExamType" NOT NULL,
    "academicYearId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamResult" (
    "id" SERIAL NOT NULL,
    "examId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "marksObtained" DOUBLE PRECISION NOT NULL,
    "maxMarks" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exam_academicYearId_idx" ON "Exam"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_examType_academicYearId_key" ON "Exam"("examType", "academicYearId");

-- CreateIndex
CREATE INDEX "ExamResult_studentId_idx" ON "ExamResult"("studentId");

-- CreateIndex
CREATE INDEX "ExamResult_subjectId_idx" ON "ExamResult"("subjectId");

-- CreateIndex
CREATE INDEX "ExamResult_teacherId_idx" ON "ExamResult"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResult_examId_studentId_subjectId_key" ON "ExamResult"("examId", "studentId", "subjectId");

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
