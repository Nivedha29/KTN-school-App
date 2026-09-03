-- CreateTable
CREATE TABLE "SchoolSetting" (
    "id" SERIAL NOT NULL,
    "schoolName" TEXT NOT NULL,
    "shortName" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "administratorName" TEXT,
    "logoUrl" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "language" TEXT NOT NULL DEFAULT 'en',
    "admissionOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolSetting_pkey" PRIMARY KEY ("id")
);
