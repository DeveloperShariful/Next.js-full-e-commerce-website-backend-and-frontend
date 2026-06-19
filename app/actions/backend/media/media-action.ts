// app/actions/backend/media-action.ts

'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { del, list, ListBlobResult } from '@vercel/blob';
import { Media, MediaType, MediaSource } from '@prisma/client';

// 1. Save uploaded file info
export async function saveMediaRecord(data: {
  url: string;
  pathname: string;
  filename: string;
  mimeType: string;
  size: number;
  source?: MediaSource;
}): Promise<{ success: boolean; media?: Media; message?: string }> {
  try {
    let type: MediaType = MediaType.OTHER;
    if (data.mimeType.startsWith('image/')) type = MediaType.IMAGE;
    else if (data.mimeType.startsWith('video/')) type = MediaType.VIDEO;
    else if (data.mimeType.includes('pdf') || data.mimeType.includes('document')) type = MediaType.DOCUMENT;

    const newMedia = await db.media.create({
      data: {
        url: data.url,
        pathname: data.pathname,
        filename: data.filename,
        originalName: data.filename,
        mimeType: data.mimeType,
        size: data.size,
        type: type,
        source: data.source ?? MediaSource.GENERAL,
      }
    });

    revalidatePath('/admin/media');
    return { success: true, media: newMedia };
  } catch (error: any) {
    console.error("Failed to save media record:", error);
    return { success: false, message: error.message };
  }
}

// 2. Fetch all media (Returns strongly typed Media Array, optional source filter)
export async function getAllMedia(source?: MediaSource): Promise<Media[]> {
  try {
    return await db.media.findMany({
      where: source ? { source } : undefined,
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    return [];
  }
}

const isVercelBlobUrl = (url: string) => url.includes('.public.blob.vercel-storage.com');

// Helper: Remove all references to a URL from every table
async function cascadeDeleteByUrl(url: string) {
  // Handle WarrantyClaim separately — mediaUrl is comma-separated
  const claims = await db.warrantyClaim.findMany({
    where: { mediaUrl: { contains: url } },
    select: { id: true, mediaUrl: true },
  });
  for (const claim of claims) {
    const remaining = (claim.mediaUrl ?? '')
      .split(',')
      .map(u => u.trim())
      .filter(u => u && u !== url)
      .join(',');
    await db.warrantyClaim.update({
      where: { id: claim.id },
      data: { mediaUrl: remaining || null },
    });
  }

  await Promise.all([
    db.product.updateMany({ where: { featuredImage: url }, data: { featuredImage: null, featuredMediaId: null } }),
    db.productImage.deleteMany({ where: { url } }),
    db.category.updateMany({ where: { image: url }, data: { image: null, mediaId: null } }),
    db.brand.updateMany({ where: { logo: url }, data: { logo: null } }),
    db.user.updateMany({ where: { image: url }, data: { image: null } }),
  ]);
}

// 3. Single Delete (Full Cascade)
export async function deleteMedia(id: string, pathname: string): Promise<{ success: boolean; message?: string }> {
  try {
    // Get the URL before deleting
    const media = await db.media.findUnique({ where: { id }, select: { url: true } });
    if (!media) return { success: false, message: 'Media not found' };

    // 1. Remove from Vercel Blob
    if (pathname && isVercelBlobUrl(pathname)) await del(pathname);

    // 2. Remove references from all tables
    await cascadeDeleteByUrl(media.url);

    // 3. Delete Media record
    await db.media.delete({ where: { id } });

    revalidatePath('/admin/media');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 4. BULK DELETE (Full Cascade)
export async function bulkDeleteMedia(items: { id: string, pathname: string | null }[]): Promise<{ success: boolean; message?: string }> {
  try {
    const ids = items.map(item => item.id);
    const pathnames = items.map(item => item.pathname).filter((p): p is string => !!p && isVercelBlobUrl(p));

    // Get all URLs before deleting
    const mediaRecords = await db.media.findMany({ where: { id: { in: ids } }, select: { url: true } });

    // 1. Remove from Vercel Blob
    if (pathnames.length > 0) await del(pathnames);

    // 2. Remove references from all tables
    await Promise.all(mediaRecords.map(m => cascadeDeleteByUrl(m.url)));

    // 3. Delete Media records
    await db.media.deleteMany({ where: { id: { in: ids } } });

    revalidatePath('/admin/media');
    return { success: true };
  } catch (error: any) {
    console.error("Bulk delete failed:", error);
    return { success: false, message: error.message };
  }
}

// 5. Auto-save Media Details
export async function updateMediaDetails(id: string, data: {
  altText?: string;
  originalName?: string;
  caption?: string;
  description?: string;
}): Promise<{ success: boolean; media?: Media; message?: string }> {
  try {
    const updatedMedia = await db.media.update({
      where: { id },
      data: {
        altText: data.altText,
        originalName: data.originalName, 
        caption: data.caption,
        description: data.description,
      }
    });
    revalidatePath('/admin/media');
    return { success: true, media: updatedMedia };
  } catch (error: any) {
    return { success: false, message: "Failed to update media details" };
  }
}

// 6. SYNC ALL EXISTING MEDIA FROM ALL MODELS
export async function syncAllExistingMedia(): Promise<{ success: boolean; count?: number; message?: string }> {
  try {
    const existingMedia = await db.media.findMany({ select: { url: true } });
    const existingUrls = new Set(existingMedia.map(m => m.url));
    const newMediaData: any[] = [];

    const guessType = (url: string): { type: MediaType; mimeType: string } => {
      const lower = url.toLowerCase();
      if (lower.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?|$)/)) return { type: MediaType.IMAGE, mimeType: 'image/jpeg' };
      if (lower.match(/\.(mp4|mov|webm)(\?|$)/)) return { type: MediaType.VIDEO, mimeType: 'video/mp4' };
      if (lower.match(/\.(pdf)(\?|$)/)) return { type: MediaType.DOCUMENT, mimeType: 'application/pdf' };
      return { type: MediaType.IMAGE, mimeType: 'image/jpeg' };
    };

    const addUrl = (url: string | null | undefined, source: MediaSource) => {
      if (!url || url.trim() === '' || existingUrls.has(url)) return;
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1]?.split('?')[0] || 'file';
      const { type, mimeType } = guessType(url);
      newMediaData.push({ url, pathname: url, filename, originalName: filename, mimeType, size: 0, type, source });
      existingUrls.add(url);
    };

    // Products - featuredImage
    const products = await db.product.findMany({ select: { featuredImage: true }, where: { featuredImage: { not: null } } });
    products.forEach(p => addUrl(p.featuredImage, MediaSource.PRODUCT));

    // Products - gallery images
    const galleryImages = await db.productImage.findMany({ select: { url: true } });
    galleryImages.forEach(img => addUrl(img.url, MediaSource.PRODUCT));

    // Categories
    const categories = await db.category.findMany({ select: { image: true }, where: { image: { not: null } } });
    categories.forEach(c => addUrl(c.image, MediaSource.CATEGORY));

    // Brands
    const brands = await db.brand.findMany({ select: { logo: true }, where: { logo: { not: null } } });
    brands.forEach(b => addUrl(b.logo, MediaSource.BRAND));

    // Users
    const users = await db.user.findMany({ select: { image: true }, where: { image: { not: null } } });
    users.forEach(u => addUrl(u.image, MediaSource.USER));

    // Warranty claims
    const claims = await db.warrantyClaim.findMany({ where: { mediaUrl: { not: null } } });
    claims.forEach(claim => {
      if (!claim.mediaUrl) return;
      claim.mediaUrl.split(',').map(u => u.trim()).filter(Boolean).forEach(url => addUrl(url, MediaSource.WARRANTY));
    });

    if (newMediaData.length > 0) {
      await db.media.createMany({ data: newMediaData, skipDuplicates: true });
    }

    revalidatePath('/admin/media');
    return { success: true, count: newMediaData.length };
  } catch (error: any) {
    console.error("Sync all failed:", error);
    return { success: false, message: error.message };
  }
}

// 7. SYNC OLD WARRANTY MEDIA (Syntax Error Fixed!)
export async function syncOldWarrantyMedia(): Promise<{ success: boolean; count?: number; message?: string }> {
  try {
    // FIX: Removed double "not", handling empty strings in the loop instead
    const claims = await db.warrantyClaim.findMany({
      where: { mediaUrl: { not: null } } 
    });

    const existingMedia = await db.media.findMany({ select: { url: true } });
    const existingUrls = new Set(existingMedia.map(m => m.url));

    let addedCount = 0;
    const newMediaData = [];

    for (const claim of claims) {
      if (!claim.mediaUrl || claim.mediaUrl.trim() === '') continue; // FIX: Handling empty strings here
      
      const urls = claim.mediaUrl.split(',').map(u => u.trim()).filter(Boolean);
      
      for (const url of urls) {
        if (!existingUrls.has(url)) {
          const urlParts = url.split('/');
          const rawFilename = urlParts[urlParts.length - 1] || 'Warranty-File';
          
          const lowerName = rawFilename.toLowerCase();
          let type: MediaType = MediaType.OTHER;
          let mimeType = 'application/octet-stream';
          
          if (lowerName.match(/\.(jpeg|jpg|gif|png|webp)$/)) {
            type = MediaType.IMAGE; mimeType = 'image/jpeg';
          } else if (lowerName.match(/\.(mp4|mov|webm)$/)) {
            type = MediaType.VIDEO; mimeType = 'video/mp4';
          }

          newMediaData.push({
            url: url,
            pathname: url,
            filename: rawFilename,
            originalName: rawFilename,
            mimeType: mimeType,
            size: 0,
            type: type,
            source: MediaSource.WARRANTY,
          });
          
          existingUrls.add(url);
          addedCount++;
        }
      }
    }

    if (newMediaData.length > 0) {
      await db.media.createMany({ data: newMediaData });
    }

    revalidatePath('/admin/media');
    return { success: true, count: addedCount };
  } catch (error: any) {
    console.error("Sync failed:", error);
    return { success: false, message: error.message };
  }
}

// 8. SYNC FROM VERCEL BLOB STORAGE
export async function syncFromVercelBlob(): Promise<{ success: boolean; count?: number; message?: string }> {
  try {
    const existingMedia = await db.media.findMany({ select: { url: true } });
    const existingUrls = new Set(existingMedia.map(m => m.url));

    const newMediaData: any[] = [];
    let cursor: string | undefined = undefined;

    // list() returns max 1000 at a time, loop until done
    do {
      const result: ListBlobResult = await list({ cursor, limit: 1000 });
      for (const blob of result.blobs) {
        if (existingUrls.has(blob.url)) continue;

        const filename = blob.pathname.split('/').pop() || blob.pathname;
        const lower = filename.toLowerCase();

        let type: MediaType = MediaType.OTHER;
        let mimeType = 'application/octet-stream';
        if (lower.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?|$)/)) { type = MediaType.IMAGE; mimeType = 'image/jpeg'; }
        else if (lower.match(/\.(mp4|mov|webm)(\?|$)/)) { type = MediaType.VIDEO; mimeType = 'video/mp4'; }
        else if (lower.match(/\.(pdf)(\?|$)/)) { type = MediaType.DOCUMENT; mimeType = 'application/pdf'; }

        newMediaData.push({
          url: blob.url,
          pathname: blob.pathname,
          filename,
          originalName: filename,
          mimeType,
          size: blob.size,
          type,
          source: MediaSource.GENERAL,
        });
        existingUrls.add(blob.url);
      }
      cursor = result.cursor;
    } while (cursor);

    if (newMediaData.length > 0) {
      await db.media.createMany({ data: newMediaData, skipDuplicates: true });
    }

    revalidatePath('/admin/media');
    return { success: true, count: newMediaData.length };
  } catch (error: any) {
    console.error("Vercel Blob sync failed:", error);
    return { success: false, message: error.message };
  }
}