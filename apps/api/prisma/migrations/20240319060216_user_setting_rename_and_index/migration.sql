/*
  Warnings:

  - You are about to drop the `UserSetting` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserSetting" DROP CONSTRAINT "UserSetting_userId_fkey";

-- DropTable
DROP TABLE "UserSetting";

-- CreateTable
CREATE TABLE "user_setting" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "value" VARCHAR(512) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_setting_name_idx" ON "user_setting"("name");

-- AddForeignKey
ALTER TABLE "user_setting" ADD CONSTRAINT "user_setting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
