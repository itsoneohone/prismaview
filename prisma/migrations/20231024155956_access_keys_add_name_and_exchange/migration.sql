/*
  Warnings:

  - Added the required column `exchange` to the `access_key` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `access_key` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Exchange" AS ENUM ('BITSTAMP', 'KRAKEN');

-- AlterTable
ALTER TABLE "access_key" ADD COLUMN     "exchange" "Exchange" NOT NULL,
ADD COLUMN     "name" VARCHAR(128) NOT NULL;
