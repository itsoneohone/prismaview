/*
  Warnings:

  - The `currentBalance` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `initialBalance` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "currentBalance",
ADD COLUMN     "currentBalance" DECIMAL(10,2) NOT NULL DEFAULT 2000,
DROP COLUMN "initialBalance",
ADD COLUMN     "initialBalance" DECIMAL(10,2) NOT NULL DEFAULT 2000;
