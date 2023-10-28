-- CreateEnum
CREATE TYPE "OrderCreatedBy" AS ENUM ('USER', 'SCRIPT');

-- CreateEnum
CREATE TYPE "OrderCurrency" AS ENUM ('EUR', 'GBP', 'USD');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'OPEN', 'CLOSED', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('LIMIT', 'MARKET');

-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "order" (
    "id" SERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" "OrderType" NOT NULL,
    "side" "OrderSide" NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "filled" DECIMAL(20,8) NOT NULL,
    "cost" DECIMAL(20,8) NOT NULL,
    "fee" DECIMAL(16,8) NOT NULL,
    "currency" "OrderCurrency" NOT NULL,
    "createdBy" "OrderCreatedBy" NOT NULL DEFAULT 'USER',
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "accessKeyId" INTEGER NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_accessKeyId_fkey" FOREIGN KEY ("accessKeyId") REFERENCES "access_key"("id") ON DELETE CASCADE ON UPDATE CASCADE;
