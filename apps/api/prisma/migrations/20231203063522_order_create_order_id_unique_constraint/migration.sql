/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "order_orderId_key" ON "order"("orderId");
