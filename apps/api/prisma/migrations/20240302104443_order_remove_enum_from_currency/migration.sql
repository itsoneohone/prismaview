/*
  Warnings:

  - Changed the type of `currency` on the `order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `base` on table `order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `quote` on table `order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "order" DROP COLUMN "currency",
ADD COLUMN     "currency" VARCHAR(8) NOT NULL,
ALTER COLUMN "base" SET NOT NULL,
ALTER COLUMN "quote" SET NOT NULL;

-- DropEnum
DROP TYPE "OrderCurrencyEnum";
