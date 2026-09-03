-- CreateTable
CREATE TABLE "Homework" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "gradeId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "dueDate" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Homework_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Homework_gradeId_idx" ON "Homework"("gradeId");

-- CreateIndex
CREATE INDEX "Homework_subjectId_idx" ON "Homework"("subjectId");

-- CreateIndex
CREATE INDEX "Homework_teacherId_idx" ON "Homework"("teacherId");

-- CreateIndex
CREATE INDEX "Homework_dueDate_idx" ON "Homework"("dueDate");

-- CreateIndex
CREATE INDEX "Homework_isActive_idx" ON "Homework"("isActive");

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
