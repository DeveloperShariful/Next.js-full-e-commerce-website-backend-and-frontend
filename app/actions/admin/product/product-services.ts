// File: app/actions/admin/product/product-services.ts

import { db } from "@/lib/prisma";
import { cleanPrice } from "@/app/actions/admin/product/product-utils";

export async function handleInventory(tx: any, product: any, data: any, defaultLocationId: string, userId?: string) {
    if (data.productType === 'SIMPLE' && data.trackQuantity) {
        
        let inventoryItems = data.inventoryData && data.inventoryData.length > 0 
            ? data.inventoryData 
            : [{ locationId: defaultLocationId, quantity: data.stock }];

        const incomingLocationIds = inventoryItems.map((i: any) => i.locationId || defaultLocationId);

        await tx.inventoryLevel.deleteMany({
            where: {
                productId: product.id,
                variantId: null,
                locationId: { notIn: incomingLocationIds }
            }
        });

        let totalStock = 0;

        for (const item of inventoryItems) {
            const targetQty = parseInt(item.quantity) || 0;
            const locId = item.locationId || defaultLocationId;
            
            if(!locId) continue;

            totalStock += targetQty;

            const existingEntry = await tx.inventoryLevel.findFirst({
                where: {
                    productId: product.id,
                    locationId: locId,
                    variantId: null 
                }
            });

            const diff = targetQty - (existingEntry ? existingEntry.quantity : 0);

            if (existingEntry) {
                if (diff !== 0) {
                    await tx.inventoryLevel.update({
                        where: { 
                            id: existingEntry.id,
                            version: existingEntry.version 
                        },
                        data: { 
                            quantity: targetQty,
                            version: { increment: 1 }
                        }
                    });
                }
            } else {
                await tx.inventoryLevel.create({
                    data: { 
                        quantity: targetQty, 
                        locationId: locId, 
                        productId: product.id, 
                        variantId: null,
                        version: 1
                    }
                });
            }

            if (diff !== 0) {
                await tx.stockHistory.create({
                    data: {
                        productId: product.id,
                        locationId: locId,
                        change: diff,
                        finalStock: targetQty,
                        reason: "Manual Admin Update",
                        userId: userId || "SYSTEM"
                    }
                });
            }
        }
        
        await tx.product.update({ 
            where: { id: product.id }, 
            data: { 
                stock: totalStock,
                version: { increment: 1 }
            } 
        });

    } else {
        await tx.inventoryLevel.deleteMany({
            where: { productId: product.id, variantId: null }
        });
    }
}

export async function handleImages(tx: any, productId: string, images: any[]) {
    const existingImages = await tx.productImage.findMany({ 
        where: { productId, variantId: null } 
    });

    const incomingIds = images.filter((img: any) => typeof img === 'object' && img.id).map((img: any) => img.id);
    const incomingUrls = images.map((img: any) => typeof img === 'string' ? img : img.url);
    
    const imagesToDelete = existingImages.filter((img: any) => {
        if (incomingIds.length > 0) {
            return !incomingIds.includes(img.id) && !incomingUrls.includes(img.url);
        }
        return !incomingUrls.includes(img.url);
    });

    if (imagesToDelete.length > 0) {
        await tx.productImage.deleteMany({
            where: { id: { in: imagesToDelete.map((i: any) => i.id) } }
        });
    }

    await Promise.all(images.map(async (img: any, idx: number) => {
        const url = typeof img === 'string' ? img : img.url;
        const mediaId = typeof img === 'object' ? img.mediaId : null;
        const altText = typeof img === 'object' ? img.altText : null;
        const id = typeof img === 'object' ? img.id : null;

        if (id) {
            await tx.productImage.update({
                where: { id },
                data: { position: idx, altText }
            });
        } else {
            const existingByUrl = existingImages.find((e: any) => e.url === url);
            if (existingByUrl) {
                await tx.productImage.update({
                    where: { id: existingByUrl.id },
                    data: { position: idx, altText, mediaId }
                });
            } else {
                await tx.productImage.create({
                    data: {
                        productId,
                        url,
                        position: idx,
                        mediaId,
                        altText,
                        variantId: null
                    }
                });
            }
        }
    }));
}

export async function handleDigitalFiles(tx: any, productId: string, isDownloadable: boolean, files: any[]) {
    if (!isDownloadable) {
        await tx.digitalFile.deleteMany({ where: { productId } });
        return;
    }

    const existingFiles = await tx.digitalFile.findMany({ where: { productId } });
    const incomingFileUrls = files.map(f => f.url);
    
    await tx.digitalFile.deleteMany({
        where: { 
            productId,
            url: { notIn: incomingFileUrls }
        }
    });

    for (const file of files) {
        const exists = existingFiles.find((f: any) => f.url === file.url);
        if (!exists) {
            await tx.digitalFile.create({
                data: {
                    productId,
                    name: file.name,
                    url: file.url
                }
            });
        }
    }
}

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

export async function handleVariations(tx: any, productId: string, variationsData: any[], productType: string, defaultLocationId: string, userId?: string) {
    if (productType.toUpperCase() !== 'VARIABLE') {
        const variants = await tx.productVariant.findMany({ where: { productId } });
        if(variants.length > 0) {
            const variantIds = variants.map((v:any) => v.id);
            await tx.inventoryLevel.deleteMany({ where: { variantId: { in: variantIds } } });
            await tx.productImage.deleteMany({ where: { variantId: { in: variantIds } } }); 
            await tx.productVariant.deleteMany({ where: { productId } });
        }
        return;
    }

    const existingVars = await tx.productVariant.findMany({ where: { productId } });
    const existingVarIds = existingVars.map((v: any) => v.id);
    const incomingVarIds = variationsData.map(v => v.id).filter(id => id && !id.toString().startsWith("temp_"));
    const varsToDelete = existingVarIds.filter((id: string) => !incomingVarIds.includes(id));
    
    if (varsToDelete.length > 0) {
        await Promise.all(varsToDelete.map(async (vId: string) => {
            const hasOrders = await tx.orderItem.findFirst({ where: { variantId: vId } });
            
            if (hasOrders) {
                await tx.productVariant.update({
                    where: { id: vId },
                    data: { deletedAt: new Date() }
                });
            } else {
                await tx.inventoryLevel.deleteMany({ where: { variantId: vId } });
                await tx.cartItem.deleteMany({ where: { variantId: vId } });
                await tx.productImage.deleteMany({ where: { variantId: vId } });
                await tx.productVariant.delete({ where: { id: vId } });
            }
        }));
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
            isPreOrder: v.isPreOrder || false,
            preOrderReleaseDate: v.preOrderReleaseDate ? new Date(v.preOrderReleaseDate) : null,
            deletedAt: null
        };

        let variantId = v.id;

        if (v.id && !v.id.toString().startsWith("temp_")) {
            await tx.productVariant.update({ 
                where: { id: v.id }, 
                data: {
                    ...variantData,
                    version: { increment: 1 }
                } 
            });
        } else {
            const newVar = await tx.productVariant.create({ data: { ...variantData, productId } });
            variantId = newVar.id;
        }

        const incomingImages = v.images || [];
        const incomingUrls = incomingImages.map((img: any) => typeof img === 'string' ? img : img.url);
        const currentVarImages = await tx.productImage.findMany({ where: { variantId } });
        
        const varImagesToDelete = currentVarImages.filter((img: any) => !incomingUrls.includes(img.url));
        if (varImagesToDelete.length > 0) {
            await tx.productImage.deleteMany({
                where: { id: { in: varImagesToDelete.map((i: any) => i.id) } }
            });
        }

        if (incomingImages.length > 0) {
            await Promise.all(incomingImages.map(async (img: any, idx: number) => {
                const url = typeof img === 'string' ? img : img.url;
                const existing = currentVarImages.find((e: any) => e.url === url);
                if (existing) {
                    await tx.productImage.update({
                        where: { id: existing.id },
                        data: { position: idx }
                    });
                } else {
                    await tx.productImage.create({
                        data: { productId, variantId, url, position: idx }
                    });
                }
            }));
        }

        const incomingLocationIds = inventoryItems.map((i: any) => i.locationId || defaultLocationId);
        await tx.inventoryLevel.deleteMany({
            where: {
                variantId: variantId,
                locationId: { notIn: incomingLocationIds }
            }
        });

        for (const item of inventoryItems) {
            const targetQty = parseInt(item.quantity) || 0;
            const locId = item.locationId || defaultLocationId;

            if(!locId) continue;

            const existingInv = await tx.inventoryLevel.findFirst({
                where: {
                    locationId: locId,
                    productId,
                    variantId 
                }
            });

            const diff = targetQty - (existingInv ? existingInv.quantity : 0);

            if (existingInv) {
                if (diff !== 0) {
                    await tx.inventoryLevel.update({
                        where: { id: existingInv.id, version: existingInv.version },
                        data: { 
                            quantity: targetQty,
                            version: { increment: 1 }
                        }
                    });
                }
            } else {
                await tx.inventoryLevel.create({
                    data: { 
                        quantity: targetQty, 
                        locationId: locId, 
                        productId, 
                        variantId,
                        version: 1
                    }
                });
            }

            if (diff !== 0) {
                await tx.stockHistory.create({
                    data: {
                        productId,
                        variantId,
                        locationId: locId,
                        change: diff,
                        finalStock: targetQty,
                        reason: "Admin Variation Update",
                        userId: userId || "SYSTEM"
                    }
                });
            }
        }
    }));

    await tx.product.update({ 
        where: { id: productId }, 
        data: { 
            stock: totalProductStock,
            version: { increment: 1 }
        } 
    });
}

export async function handleBundleItems(tx: any, productId: string, productType: string, bundleItems: any[]) {
    if (productType.toUpperCase() !== 'BUNDLE') {
        await tx.bundleItem.deleteMany({ where: { parentProductId: productId } });
        return;
    }

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