-- CreateTable
CREATE TABLE "Notice" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "expiresAt" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notice_createdById_idx" ON "Notice"("createdById");

-- CreateIndex
CREATE INDEX "Notice_isActive_idx" ON "Notice"("isActive");

-- CreateIndex
CREATE INDEX "Notice_createdAt_idx" ON "Notice"("createdAt");

-- CreateIndex
CREATE INDEX "Notice_expiresAt_idx" ON "Notice"("expiresAt");

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
