-- CreateTable
CREATE TABLE "price" (
    "id" SERIAL NOT NULL,
    "symbol" VARCHAR(16) NOT NULL,
    "base" VARCHAR(8) NOT NULL,
    "quote" VARCHAR(8) NOT NULL,
    "open" DECIMAL(20,8) NOT NULL,
    "high" DECIMAL(20,8) NOT NULL,
    "low" DECIMAL(20,8) NOT NULL,
    "close" DECIMAL(20,8) NOT NULL,
    "volume" DECIMAL(20,8) NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "datetime" TIMESTAMPTZ NOT NULL,
    "exchange" "ExchangeNameEnum" NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "price_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_symbol_idx" ON "price"("symbol");

-- CreateIndex
CREATE INDEX "price_datetime_idx" ON "price"("datetime");
