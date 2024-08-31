-- CreateTable
CREATE TABLE "measures" (
    "id" TEXT NOT NULL,
    "measure_uuid" TEXT NOT NULL,
    "customer_code" TEXT NOT NULL,
    "measure_datetime" TIMESTAMP(3) NOT NULL,
    "measure_type" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "measure_value" INTEGER,
    "has_confirmed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "measures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "measures_measure_uuid_key" ON "measures"("measure_uuid");
