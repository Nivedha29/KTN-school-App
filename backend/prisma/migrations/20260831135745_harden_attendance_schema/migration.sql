-- Remove old foreign keys safely
ALTER TABLE "AttendanceRecord"
DROP CONSTRAINT IF EXISTS "AttendanceRecord_studentId_fkey";

ALTER TABLE "AttendanceSession"
DROP CONSTRAINT IF EXISTS "AttendanceSession_timetableEntryId_fkey";

ALTER TABLE "AttendanceSession"
DROP CONSTRAINT IF EXISTS "AttendanceSession_markedByUserId_fkey";


-- Add markedByUserId temporarily as nullable
ALTER TABLE "AttendanceSession"
ADD COLUMN IF NOT EXISTS "markedByUserId" INTEGER;


-- Populate existing attendance sessions
-- using the User ID of the teacher assigned to the timetable entry
UPDATE "AttendanceSession" AS attendance
SET "markedByUserId" = teacher."userId"
FROM "TimetableEntry" AS timetable
JOIN "TeacherProfile" AS teacher
  ON teacher."id" = timetable."teacherId"
WHERE attendance."timetableEntryId" = timetable."id"
  AND attendance."markedByUserId" IS NULL;


-- Make sure every existing attendance session was assigned
-- before making the column required
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "AttendanceSession"
    WHERE "markedByUserId" IS NULL
  ) THEN
    RAISE EXCEPTION
      'Some attendance sessions could not be linked to a teacher user.';
  END IF;
END $$;


-- Now make markedByUserId required
ALTER TABLE "AttendanceSession"
ALTER COLUMN "markedByUserId" SET NOT NULL;


-- Store attendanceDate as PostgreSQL DATE
ALTER TABLE "AttendanceSession"
ALTER COLUMN "attendanceDate"
TYPE DATE
USING "attendanceDate"::date;


-- Create indexes
CREATE INDEX IF NOT EXISTS
"AttendanceSession_markedByUserId_idx"
ON "AttendanceSession"("markedByUserId");

CREATE INDEX IF NOT EXISTS
"Enrollment_studentId_idx"
ON "Enrollment"("studentId");

CREATE INDEX IF NOT EXISTS
"Enrollment_gradeId_idx"
ON "Enrollment"("gradeId");

CREATE INDEX IF NOT EXISTS
"Enrollment_isActive_idx"
ON "Enrollment"("isActive");

CREATE INDEX IF NOT EXISTS
"SubjectTeacher_subjectId_idx"
ON "SubjectTeacher"("subjectId");

CREATE INDEX IF NOT EXISTS
"SubjectTeacher_teacherId_idx"
ON "SubjectTeacher"("teacherId");


-- Recreate foreign keys with safer delete behavior
ALTER TABLE "AttendanceSession"
ADD CONSTRAINT "AttendanceSession_timetableEntryId_fkey"
FOREIGN KEY ("timetableEntryId")
REFERENCES "TimetableEntry"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;


ALTER TABLE "AttendanceSession"
ADD CONSTRAINT "AttendanceSession_markedByUserId_fkey"
FOREIGN KEY ("markedByUserId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;


ALTER TABLE "AttendanceRecord"
ADD CONSTRAINT "AttendanceRecord_studentId_fkey"
FOREIGN KEY ("studentId")
REFERENCES "StudentProfile"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;