/*
  Warnings:

  - The `type` column on the `Address` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `Media` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `paymentConfig` on the `StoreSettings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,productId,variantId]` on the table `Wishlist` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Brand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Collection` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BackorderStatus" AS ENUM ('DO_NOT_ALLOW', 'ALLOW', 'ALLOW_BUT_NOTIFY');

-- CreateEnum
CREATE TYPE "TaxStatus" AS ENUM ('TAXABLE', 'SHIPPING_ONLY', 'NONE');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('BILLING', 'SHIPPING');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "ShippingMethodType" AS ENUM ('FLAT_RATE', 'FREE_SHIPPING', 'LOCAL_PICKUP', 'CARRIER_CALCULATED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DiscountType" ADD VALUE 'FIXED_CART';
ALTER TYPE "DiscountType" ADD VALUE 'FIXED_PRODUCT';

-- AlterEnum
ALTER TYPE "FulfillmentStatus" ADD VALUE 'PICKED_UP';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'DRAFT';
ALTER TYPE "OrderStatus" ADD VALUE 'READY_FOR_PICKUP';

-- DropIndex
DROP INDEX "Wishlist_userId_productId_key";

-- AlterTable
ALTER TABLE "Address" DROP COLUMN "type",
ADD COLUMN     "type" "AddressType" NOT NULL DEFAULT 'SHIPPING';

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "DigitalFile" ADD COLUMN     "accessCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Discount" ADD COLUMN     "excludeSaleItems" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "folderId" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "MediaType" NOT NULL DEFAULT 'IMAGE';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountId" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "netTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "pickupLocationId" TEXT,
ADD COLUMN     "refundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "shippingType" "ShippingMethodType" NOT NULL DEFAULT 'FLAT_RATE',
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "PaymentMethodConfig" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "instructions" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "ageGroup" TEXT,
ADD COLUMN     "backorderStatus" "BackorderStatus" NOT NULL DEFAULT 'DO_NOT_ALLOW',
ADD COLUMN     "downloadExpiry" INTEGER,
ADD COLUMN     "downloadLimit" INTEGER,
ADD COLUMN     "enableReviews" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lowStockThreshold" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "mpn" TEXT,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shippingClassId" TEXT,
ADD COLUMN     "soldIndividually" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taxClassId" TEXT,
ADD COLUMN     "taxStatus" "TaxStatus" NOT NULL DEFAULT 'TAXABLE',
ADD COLUMN     "videoThumbnail" TEXT;

-- AlterTable
ALTER TABLE "ProductAttribute" ADD COLUMN     "brandId" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "costPerItem" DOUBLE PRECISION,
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "length" DOUBLE PRECISION,
ADD COLUMN     "trackQuantity" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "width" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "RecentlyViewed" ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "ShippingRate" ADD COLUMN     "carrierServiceId" TEXT,
ADD COLUMN     "freeShippingRequirement" TEXT,
ADD COLUMN     "taxStatus" TEXT NOT NULL DEFAULT 'taxable',
ADD COLUMN     "type" "ShippingMethodType" NOT NULL DEFAULT 'FLAT_RATE';

-- AlterTable
ALTER TABLE "StoreSettings" DROP COLUMN "paymentConfig",
ADD COLUMN     "dimensionUnit" TEXT NOT NULL DEFAULT 'cm',
ADD COLUMN     "generalConfig" JSONB,
ADD COLUMN     "storeAddress" JSONB,
ADD COLUMN     "taxSettings" JSONB,
ADD COLUMN     "weightUnit" TEXT NOT NULL DEFAULT 'kg';

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "TaxRate" ADD COLUMN     "class" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "shipping" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Wishlist" ADD COLUMN     "variantId" TEXT;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryTranslation" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metaTitle" TEXT,
    "metaDesc" TEXT,

    CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTranslation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "metaTitle" TEXT,
    "metaDesc" TEXT,

    CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postcode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'AU',
    "instructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "openingHours" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PickupLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbandonedCheckout" (
    "id" TEXT NOT NULL,
    "cartToken" TEXT,
    "email" TEXT,
    "userId" TEXT,
    "items" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "recoveryUrl" TEXT NOT NULL,
    "isRecovered" BOOLEAN NOT NULL DEFAULT false,
    "recoveredAt" TIMESTAMP(3),
    "remindersSent" INTEGER NOT NULL DEFAULT 0,
    "lastReminder" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbandonedCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeConfig" (
    "id" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "publishableKey" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "webhookSecret" TEXT,
    "isTestMode" BOOLEAN NOT NULL DEFAULT true,
    "captureMethod" TEXT NOT NULL DEFAULT 'automatic',
    "savedCards" BOOLEAN NOT NULL DEFAULT true,
    "threeDSecure" TEXT NOT NULL DEFAULT 'optional',
    "statementDescriptor" TEXT,
    "paymentRequestButtons" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL DEFAULT 'Credit Card',
    "description" TEXT NOT NULL DEFAULT 'Pay securely with your credit card.',
    "iconUrl" TEXT,

    CONSTRAINT "StripeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaypalConfig" (
    "id" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "email" TEXT,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "paymentAction" TEXT NOT NULL DEFAULT 'SALE',
    "invoicePrefix" TEXT DEFAULT 'WC-',
    "debugLog" BOOLEAN NOT NULL DEFAULT false,
    "apiUsername" TEXT,
    "apiPassword" TEXT,
    "apiSignature" TEXT,
    "brandName" TEXT,
    "landingPage" TEXT NOT NULL DEFAULT 'LOGIN',
    "requireAddress" BOOLEAN NOT NULL DEFAULT false,
    "buttonStyle" JSONB,

    CONSTRAINT "PaypalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenericPaymentConfig" (
    "id" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "bankAccountDetails" JSONB,
    "chequeInstructions" TEXT,

    CONSTRAINT "GenericPaymentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarrierService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "isSandbox" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,

    CONSTRAINT "CarrierService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "heading" TEXT,
    "content" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "recipients" TEXT,
    "emailType" TEXT NOT NULL DEFAULT 'html',
    "fromName" TEXT,
    "fromEmail" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_language_key" ON "CategoryTranslation"("categoryId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingClass_slug_key" ON "ShippingClass"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_productId_language_key" ON "ProductTranslation"("productId", "language");

-- CreateIndex
CREATE INDEX "AbandonedCheckout_email_idx" ON "AbandonedCheckout"("email");

-- CreateIndex
CREATE INDEX "AbandonedCheckout_isRecovered_idx" ON "AbandonedCheckout"("isRecovered");

-- CreateIndex
CREATE UNIQUE INDEX "StripeConfig_paymentMethodId_key" ON "StripeConfig"("paymentMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "PaypalConfig_paymentMethodId_key" ON "PaypalConfig"("paymentMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "GenericPaymentConfig_paymentMethodId_key" ON "GenericPaymentConfig"("paymentMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "CarrierService_slug_key" ON "CarrierService"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_slug_key" ON "EmailTemplate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_userId_productId_variantId_key" ON "Wishlist"("userId", "productId", "variantId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shippingClassId_fkey" FOREIGN KEY ("shippingClassId") REFERENCES "ShippingClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "PickupLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbandonedCheckout" ADD CONSTRAINT "AbandonedCheckout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentlyViewed" ADD CONSTRAINT "RecentlyViewed_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeConfig" ADD CONSTRAINT "StripeConfig_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethodConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaypalConfig" ADD CONSTRAINT "PaypalConfig_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethodConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenericPaymentConfig" ADD CONSTRAINT "GenericPaymentConfig_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethodConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingRate" ADD CONSTRAINT "ShippingRate_carrierServiceId_fkey" FOREIGN KEY ("carrierServiceId") REFERENCES "CarrierService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaFolder" ADD CONSTRAINT "MediaFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MediaFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "MediaFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
