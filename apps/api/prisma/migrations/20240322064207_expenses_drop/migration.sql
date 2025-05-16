/*
  Warnings:

  - You are about to drop the `expense` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "expense" DROP CONSTRAINT "expense_userId_fkey";

-- DropTable
DROP TABLE "expense";
