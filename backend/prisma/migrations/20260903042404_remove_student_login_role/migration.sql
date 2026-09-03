/*
  Warnings:

  - The values [STUDENT] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `userId` on the `StudentProfile` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'TEACHER', 'PARENT');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "StudentProfile" DROP CONSTRAINT "StudentProfile_userId_fkey";

-- DropIndex
DROP INDEX "StudentProfile_userId_key";

-- AlterTable
ALTER TABLE "StudentProfile" DROP COLUMN "userId";
