-- AlterTable
ALTER TABLE "order" ADD COLUMN     "base" VARCHAR(8),
ADD COLUMN     "quote" VARCHAR(8);
UPDATE "order" SET "base"=split_part("symbol", '/', 1), "quote"=split_part("symbol", '/', 2);