// app/actions/admin/product/helpers/product-services.ts

import { generateSlug, cleanPrice } from "@/app/actions/admin/product/product-utils";

// ইনভেন্টরি হ্যান্ডেল করা
export async function handleInventory(tx: any, product: any, data: any, locationId: string) {
    if (data.productType === 'SIMPLE' && data.trackQuantity && locationId) {
        
        const existingInventory = await tx.inventoryLevel.findFirst({
            where: {
                locationId: locationId,
                productId: product.id,
                variantId: null 
            }
        });

        if (existingInventory) {
            await tx.inventoryLevel.update({
                where: { id: existingInventory.id },
                data: { quantity: data.stock }
            });
        } else {
            await tx.inventoryLevel.create({
                data: {
                    quantity: data.stock,
                    locationId,
                    productId: product.id,
                    variantId: null
                }
            });
        }
        
        await tx.product.update({ where: { id: product.id }, data: { stock: data.stock } });
    }
}

// গ্যালারি ইমেজ হ্যান্ডেল করা
export async function handleImages(tx: any, productId: string, images: string[]) {
    await tx.productImage.deleteMany({ where: { productId } });
    if (images.length > 0) {
        await tx.productImage.createMany({
            data: images.map((url, idx) => ({
                productId,
                url,
                position: idx
            }))
        });
    }
}

// ডিজিটাল ফাইল হ্যান্ডেল করা
export async function handleDigitalFiles(tx: any, productId: string, isDownloadable: boolean, files: any[]) {
    await tx.digitalFile.deleteMany({ where: { productId } });
    if (isDownloadable && files.length > 0) {
        await tx.digitalFile.createMany({
            data: files.map((file: any) => ({
                productId,
                name: file.name,
                url: file.url
            }))
        });
    }
}

// অ্যাট্রিবিউট সিঙ্ক করা
export async function handleAttributes(tx: any, productId: string, attributesData: any[]) {
    const existingAttrs = await tx.productAttribute.findMany({ where: { productId } });
    const existingAttrIds = existingAttrs.map((a: any) => a.id);
    const incomingAttrIds = attributesData.map(a => a.id).filter(id => id && !id.startsWith("temp_"));

    const attrsToDelete = existingAttrIds.filter((id: string) => !incomingAttrIds.includes(id));
    if (attrsToDelete.length > 0) {
        await tx.productAttribute.deleteMany({ where: { id: { in: attrsToDelete } } });
    }

    await Promise.all(attributesData.map(async (attr, index) => {
        const attrData = {
            name: attr.name,
            values: attr.values,
            visible: attr.visible,
            variation: attr.variation,
            position: attr.position !== undefined ? attr.position : index // Updated: Save position
        };

        if (attr.id && !attr.id.toString().startsWith("temp_")) {
            return tx.productAttribute.update({ where: { id: attr.id }, data: attrData });
        } else {
            return tx.productAttribute.create({ data: { ...attrData, productId } });
        }
    }));
}

// ভেরিয়েশন সিঙ্ক করা (Updated with Images & Details)
export async function handleVariations(tx: any, productId: string, variationsData: any[], productType: string, locationId: string) {
    if (productType.toUpperCase() !== 'VARIABLE') return;

    const existingVars = await tx.productVariant.findMany({ where: { productId } });
    const existingVarIds = existingVars.map((v: any) => v.id);
    const incomingVarIds = variationsData.map(v => v.id).filter(id => id && !id.startsWith("temp_"));

    const varsToDelete = existingVarIds.filter((id: string) => !incomingVarIds.includes(id));
    if (varsToDelete.length > 0) {
        await tx.productVariant.deleteMany({ where: { id: { in: varsToDelete } } });
    }

    let totalStock = 0;

    for (const v of variationsData) {
        const variantStock = parseInt(v.stock) || 0;
        const variantPrice = cleanPrice(v.price);
        
        const variantData = {
            name: v.name || "Variation",
            sku: v.sku || null,
            price: variantPrice,
            stock: variantStock,
            attributes: v.attributes || {}, 
            trackQuantity: true,
            
            // 🔥 UPDATE: Saving Advanced Variant Details & Image
            barcode: v.barcode || null,
            costPerItem: v.costPerItem ? cleanPrice(v.costPerItem) : null,
            weight: v.weight ? parseFloat(v.weight) : null,
            length: v.length ? parseFloat(v.length) : null,
            width: v.width ? parseFloat(v.width) : null,
            height: v.height ? parseFloat(v.height) : null,
            image: v.image || null // Direct image field on ProductVariant
        };

        let variantId = v.id;

        if (v.id && !v.id.toString().startsWith("temp_")) {
            await tx.productVariant.update({ where: { id: v.id }, data: variantData });
        } else {
            const newVar = await tx.productVariant.create({ data: { ...variantData, productId } });
            variantId = newVar.id;
        }

        // Inventory Upsert for Variant
        if (locationId) {
            await tx.inventoryLevel.upsert({
                where: {
                    locationId_productId_variantId: {
                        locationId,
                        productId,
                        variantId
                    } as any
                },
                update: { quantity: variantStock },
                create: { quantity: variantStock, locationId, productId, variantId }
            });
        }
        
        totalStock += variantStock;
    }

    await tx.product.update({ where: { id: productId }, data: { stock: totalStock } });
}

// 🔥 NEW FUNCTION: বান্ডেল আইটেম হ্যান্ডেল করা
export async function handleBundleItems(tx: any, productId: string, productType: string, bundleItems: any[]) {
    // শুধুমাত্র বান্ডেল প্রোডাক্টের জন্য কাজ করবে
    if (productType.toUpperCase() !== 'BUNDLE') return;

    // ১. আগের বান্ডেল আইটেমগুলো ক্লিয়ার করে দিচ্ছি (Safe update method)
    await tx.bundleItem.deleteMany({
        where: { parentProductId: productId }
    });

    // ২. নতুন আইটেমগুলো তৈরি করছি
    if (bundleItems && bundleItems.length > 0) {
        await tx.bundleItem.createMany({
            data: bundleItems.map((item: any) => ({
                parentProductId: productId,
                childProductId: item.childProductId,
                quantity: parseInt(item.quantity) || 1
            }))
        });
    }
}