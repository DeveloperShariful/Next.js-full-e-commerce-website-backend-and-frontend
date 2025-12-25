// app/actions/admin/product/helpers/product-services.ts

import { generateSlug, cleanPrice } from "@/app/actions/admin/product/product-utils";

// ইনভেন্টরি হ্যান্ডেল করা
export async function handleInventory(tx: any, product: any, data: any, locationId: string) {
    if (data.productType === 'SIMPLE' && data.trackQuantity && locationId) {
        await tx.inventoryLevel.upsert({
            where: {
                locationId_productId_variantId: {
                    locationId,
                    productId: product.id,
                    variantId: "" 
                } as any 
            },
            update: { quantity: data.stock },
            create: { quantity: data.stock, locationId, productId: product.id }
        });
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

    for (const attr of attributesData) {
        const attrData = {
            name: attr.name,
            values: attr.values,
            visible: attr.visible,
            variation: attr.variation,
            position: 0 
        };

        if (attr.id && !attr.id.toString().startsWith("temp_")) {
            await tx.productAttribute.update({ where: { id: attr.id }, data: attrData });
        } else {
            await tx.productAttribute.create({ data: { ...attrData, productId } });
        }
    }
}

// ভেরিয়েশন সিঙ্ক করা
export async function handleVariations(tx: any, productId: string, variationsData: any[], productType: string, locationId: string) {
    if (productType !== 'VARIABLE') return;

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
            trackQuantity: true
        };

        let variantId = v.id;

        if (v.id && !v.id.toString().startsWith("temp_")) {
            await tx.productVariant.update({ where: { id: v.id }, data: variantData });
        } else {
            const newVar = await tx.productVariant.create({ data: { ...variantData, productId } });
            variantId = newVar.id;
        }

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