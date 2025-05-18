-- CreateTable
CREATE TABLE "access_key" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" VARCHAR(256) NOT NULL,
    "secret" VARCHAR(256) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "access_key_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "access_key" ADD CONSTRAINT "access_key_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
