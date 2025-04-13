-- CreateIndex
CREATE INDEX "Restaurant_name_idx" ON "Restaurant"("name");

-- CreateIndex
CREATE INDEX "Restaurant_location_idx" ON "Restaurant"("location");

-- CreateIndex
CREATE INDEX "Restaurant_bookingLink_idx" ON "Restaurant"("bookingLink");

-- CreateIndex
CREATE INDEX "Restaurant_createdAt_idx" ON "Restaurant"("createdAt");
