/*
  Warnings:

  - A unique constraint covering the columns `[symbol,datetime,exchange]` on the table `price` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "price_symbol_datetime_exchange_key" ON "price"("symbol", "datetime", "exchange");
