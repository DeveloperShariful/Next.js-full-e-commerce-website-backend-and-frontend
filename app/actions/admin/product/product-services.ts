// File: app/actions/admin/product/product-services.ts

import { db } from "@/lib/prisma";
import { cleanPrice } from "@/app/actions/admin/product/product-utils";

// --- 1. SMART INVENTORY HANDLER (Simple Product Fix) ---
export async function handleInventory(tx: any, product: any, data: any, defaultLocationId: string) {
    if (data.productType === 'SIMPLE' && data.trackQuantity) {
        
        let inventoryItems = data.inventoryData && data.inventoryData.length > 0 
            ? data.inventoryData 
            : [{ locationId: defaultLocationId, quantity: data.stock }];

        let totalStock = 0;

        for (const item of inventoryItems) {
            const qty = parseInt(item.quantity) || 0;
            const locId = item.locationId || defaultLocationId;
            
            if(!locId) continue;

            totalStock += qty;

            const existingEntries = await tx.inventoryLevel.findMany({
                where: {
                    productId: product.id,
                    locationId: locId,
                    variantId: null 
                },
                orderBy: { id: 'asc' } 
            });

            if (existingEntries.length > 0) {
                const firstEntry = existingEntries[0];
                await tx.inventoryLevel.update({
                    where: { id: firstEntry.id },
                    data: { quantity: qty }
                });

                if (existingEntries.length > 1) {
                    const idsToDelete = existingEntries.slice(1).map((e: any) => e.id);
                    await tx.inventoryLevel.deleteMany({
                        where: { id: { in: idsToDelete } }
                    });
                }
            } else {
                await tx.inventoryLevel.create({
                    data: { 
                        quantity: qty, 
                        locationId: locId, 
                        productId: product.id, 
                        variantId: null 
                    }
                });
            }
        }
        await tx.product.update({ 
            where: { id: product.id }, 
            data: { stock: totalStock } 
        });
    }
}

// --- 2. IMAGE HANDLER ---
export async function handleImages(tx: any, productId: string, images: string[]) {
    const existingImages = await tx.productImage.findMany({ 
        where: { productId, variantId: null } 
    });

    const existingUrls = existingImages.map((img: any) => img.url);
    
    const imagesToDelete = existingImages.filter((img: any) => !images.includes(img.url));

    const imagesToCreate = images.filter((url) => !existingUrls.includes(url));

    if (imagesToDelete.length > 0) {
        await tx.productImage.deleteMany({
            where: { id: { in: imagesToDelete.map((i: any) => i.id) } }
        });
    }

    if (imagesToCreate.length > 0) {
        let startPosition = existingImages.length - imagesToDelete.length;
        await tx.productImage.createMany({
            data: imagesToCreate.map((url, idx) => ({
                productId,
                url,
                position: startPosition + idx,
                variantId: null
            }))
        });
    }
}

// --- 3. DIGITAL FILES ---
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

// --- 4. ATTRIBUTES HANDLER ---
export async function handleAttributes(tx: any, productId: string, attributesData: any[]) {
    const existingAttrs = await tx.productAttribute.findMany({ where: { productId } });
    const existingAttrIds = existingAttrs.map((a: any) => a.id);
    
    const incomingAttrIds = attributesData.map(a => a.id).filter(id => id && !id.toString().startsWith("temp_"));
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
            position: index
        };

        if (attr.id && !attr.id.toString().startsWith("temp_")) {
            return tx.productAttribute.update({ where: { id: attr.id }, data: attrData });
        } else {
            return tx.productAttribute.create({ data: { ...attrData, productId } });
        }
    }));
}

// --- 5. VARIATIONS HANDLER (Variable Product Fix) ---
export async function handleVariations(tx: any, productId: string, variationsData: any[], productType: string, defaultLocationId: string) {
    if (productType.toUpperCase() !== 'VARIABLE') return;

    const existingVars = await tx.productVariant.findMany({ where: { productId } });
    const existingVarIds = existingVars.map((v: any) => v.id);
    
    const incomingVarIds = variationsData.map(v => v.id).filter(id => id && !id.toString().startsWith("temp_"));
    const varsToDelete = existingVarIds.filter((id: string) => !incomingVarIds.includes(id));

    if (varsToDelete.length > 0) {
        await tx.productVariant.deleteMany({ where: { id: { in: varsToDelete } } });
    }

    let totalProductStock = 0;

    await Promise.all(variationsData.map(async (v) => {
        
        let variantStock = 0;
        let inventoryItems = v.inventoryData && v.inventoryData.length > 0 
            ? v.inventoryData 
            : [{ locationId: defaultLocationId, quantity: parseInt(v.stock) || 0 }];

        inventoryItems.forEach((item: any) => variantStock += (parseInt(item.quantity) || 0));
        
        totalProductStock += variantStock;

        const variantData = {
            name: v.name || "Variation",
            sku: v.sku || null,
            price: cleanPrice(v.price),
            stock: variantStock,
            attributes: v.attributes || {}, 
            trackQuantity: true,
            barcode: v.barcode || null,
            costPerItem: v.costPerItem ? cleanPrice(v.costPerItem) : null,
            weight: v.weight ? parseFloat(v.weight) : null,
            length: v.length ? parseFloat(v.length) : null,
            width: v.width ? parseFloat(v.width) : null,
            height: v.height ? parseFloat(v.height) : null,
        };

        let variantId = v.id;

        if (v.id && !v.id.toString().startsWith("temp_")) {
            await tx.productVariant.update({ where: { id: v.id }, data: variantData });
        } else {
            const newVar = await tx.productVariant.create({ data: { ...variantData, productId } });
            variantId = newVar.id;
        }

        await tx.productImage.deleteMany({ where: { variantId } });
        if (v.images && Array.isArray(v.images) && v.images.length > 0) {
            await tx.productImage.createMany({
                data: v.images.map((url: string, idx: number) => ({
                    productId: productId,
                    variantId: variantId,
                    url: url,
                    position: idx
                }))
            });
        }

        for (const item of inventoryItems) {
            const qty = parseInt(item.quantity) || 0;
            const locId = item.locationId || defaultLocationId;

            if(!locId) continue;

            await tx.inventoryLevel.upsert({
                where: {
                    locationId_productId_variantId: {
                        locationId: locId,
                        productId,
                        variantId 
                    } as any
                },
                update: { quantity: qty },
                create: { quantity: qty, locationId: locId, productId, variantId }
            });
        }
    }));

    await tx.product.update({ 
        where: { id: productId }, 
        data: { stock: totalProductStock } 
    });
}

export async function handleBundleItems(tx: any, productId: string, productType: string, bundleItems: any[]) {
    if (productType.toUpperCase() !== 'BUNDLE') return;

    await tx.bundleItem.deleteMany({ where: { parentProductId: productId } });

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