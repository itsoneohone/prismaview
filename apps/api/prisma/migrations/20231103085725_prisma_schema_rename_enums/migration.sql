/*
  Warnings:

  - The `exchange` column on the `access_key` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `side` column on the `order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `currency` column on the `order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `createdBy` column on the `order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RoleEnum" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ExchangeNameEnum" AS ENUM ('BITSTAMP', 'KRAKEN');

-- CreateEnum
CREATE TYPE "OrderCreatedByEnum" AS ENUM ('USER', 'SCRIPT');

-- CreateEnum
CREATE TYPE "OrderCurrencyEnum" AS ENUM ('EUR', 'GBP', 'USD');

-- CreateEnum
CREATE TYPE "OrderStatusEnum" AS ENUM ('PENDING', 'OPEN', 'CLOSED', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrderTypeEnum" AS ENUM ('LIMIT', 'MARKET');

-- CreateEnum
CREATE TYPE "OrderSideEnum" AS ENUM ('BUY', 'SELL');

-- AlterTable
ALTER TABLE "access_key" DROP COLUMN "exchange",
ADD COLUMN     "exchange" "ExchangeNameEnum" NOT NULL DEFAULT 'KRAKEN';

-- AlterTable
ALTER TABLE "order" DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatusEnum" NOT NULL DEFAULT 'CLOSED',
DROP COLUMN "type",
ADD COLUMN     "type" "OrderTypeEnum" NOT NULL DEFAULT 'MARKET',
DROP COLUMN "side",
ADD COLUMN     "side" "OrderSideEnum" NOT NULL DEFAULT 'BUY',
DROP COLUMN "currency",
ADD COLUMN     "currency" "OrderCurrencyEnum" NOT NULL DEFAULT 'USD',
DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" "OrderCreatedByEnum" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "user" DROP COLUMN "role",
ADD COLUMN     "role" "RoleEnum" NOT NULL DEFAULT 'USER';

-- DropEnum
DROP TYPE "Exchange";

-- DropEnum
DROP TYPE "OrderCreatedBy";

-- DropEnum
DROP TYPE "OrderCurrency";

-- DropEnum
DROP TYPE "OrderSide";

-- DropEnum
DROP TYPE "OrderStatus";

-- DropEnum
DROP TYPE "OrderType";

-- DropEnum
DROP TYPE "Role";
