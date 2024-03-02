/*
  Warnings:

  - You are about to alter the column `orderId` on the `order` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(256)`.
  - You are about to alter the column `symbol` on the `order` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(16)`.
  - You are about to alter the column `email` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(256)`.
  - You are about to alter the column `hash` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(512)`.
  - You are about to alter the column `firstName` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(256)`.
  - You are about to alter the column `lastName` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(256)`.

*/
-- AlterTable
ALTER TABLE "order" ALTER COLUMN "orderId" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "symbol" SET DATA TYPE VARCHAR(16);

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "email" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "hash" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "firstName" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "lastName" SET DATA TYPE VARCHAR(256);
