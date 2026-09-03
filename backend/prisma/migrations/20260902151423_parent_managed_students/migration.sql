/*
  Parent-managed student migration

  Existing StudentProfile rows already exist, so:
  1. Add name as nullable
  2. Copy name from User
  3. Fill any remaining NULL values
  4. Make name required
  5. Make userId optional
*/

-- DropForeignKey
ALTER TABLE "StudentProfile"
DROP CONSTRAINT "StudentProfile_userId_fkey";

-- Add new columns safely
ALTER TABLE "StudentProfile"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "name" TEXT,
ADD COLUMN "schoolGrade" TEXT,
ADD COLUMN "schoolName" TEXT;

-- Copy existing student names from User
UPDATE "StudentProfile"
SET "name" = "User"."name"
FROM "User"
WHERE "StudentProfile"."userId" = "User"."id";

-- Safety fallback for any student without a linked User
UPDATE "StudentProfile"
SET "name" = 'Student'
WHERE "name" IS NULL;

-- Make name required after existing rows are populated
ALTER TABLE "StudentProfile"
ALTER COLUMN "name" SET NOT NULL;

-- New students do not require a User/login account
ALTER TABLE "StudentProfile"
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "StudentProfile"
ADD CONSTRAINT "StudentProfile_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;