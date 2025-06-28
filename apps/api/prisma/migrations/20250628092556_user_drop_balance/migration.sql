/*
  Warnings:

  - You are about to drop the column `currentBalance` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `initialBalance` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "currentBalance",
DROP COLUMN "initialBalance";
