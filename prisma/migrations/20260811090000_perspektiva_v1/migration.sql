-- ПЕРСПЕКТИВА v1: геолокация, линии, долги и управленческие финансы
ALTER TABLE "Store" ADD COLUMN "debt" REAL NOT NULL DEFAULT 0;
ALTER TABLE "Store" ADD COLUMN "routeLineId" INTEGER;
ALTER TABLE "Store" ADD COLUMN "routeOrder" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Order" ADD COLUMN "debtPosted" BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "debtAmount" REAL NOT NULL DEFAULT 0;

CREATE TABLE "RouteLine" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "title" TEXT NOT NULL,
  "areaSummary" TEXT,
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "RouteLine_title_key" ON "RouteLine"("title");

ALTER TABLE "DeliveryRoute" ADD COLUMN "lineId" INTEGER;

CREATE TABLE "FinanceCategory" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT 1,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "FinanceCategory_name_type_key" ON "FinanceCategory"("name", "type");
CREATE INDEX "FinanceCategory_type_active_idx" ON "FinanceCategory"("type", "active");

ALTER TABLE "FinanceEntry" ADD COLUMN "storeId" INTEGER;
ALTER TABLE "FinanceEntry" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "FinanceEntry" ADD COLUMN "isReversal" BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE "FinanceEntry" ADD COLUMN "reversalOfId" INTEGER;
ALTER TABLE "FinanceEntry" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX "FinanceEntry_storeId_idx" ON "FinanceEntry"("storeId");
CREATE INDEX "FinanceEntry_reversalOfId_idx" ON "FinanceEntry"("reversalOfId");
CREATE INDEX "Store_routeLineId_idx" ON "Store"("routeLineId");
CREATE INDEX "DeliveryRoute_lineId_idx" ON "DeliveryRoute"("lineId");
