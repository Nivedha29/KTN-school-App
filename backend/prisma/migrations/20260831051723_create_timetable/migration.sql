-- CreateTable
CREATE TABLE "TimetableEntry" (
    "id" SERIAL NOT NULL,
    "gradeId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimetableEntry_gradeId_idx" ON "TimetableEntry"("gradeId");

-- CreateIndex
CREATE INDEX "TimetableEntry_subjectId_idx" ON "TimetableEntry"("subjectId");

-- CreateIndex
CREATE INDEX "TimetableEntry_teacherId_idx" ON "TimetableEntry"("teacherId");

-- CreateIndex
CREATE INDEX "TimetableEntry_dayOfWeek_idx" ON "TimetableEntry"("dayOfWeek");

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
