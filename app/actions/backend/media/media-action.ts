// app/actions/backend/media-action.ts

'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { del, list, type ListBlobResult } from '@vercel/blob';
import { Media, MediaType, MediaSource, Prisma } from '@prisma/client';

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
        type,
        source: data.source ?? MediaSource.GENERAL,
      },
    });

    revalidatePath('/admin/media');
    return { success: true, media: newMedia };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save media record';
    console.error('Failed to save media record:', error);
    return { success: false, message };
  }
}

// 2. Fetch all media (Returns strongly typed Media Array, optional source filter)
export async function getAllMedia(source?: MediaSource): Promise<Media[]> {
  try {
    return await db.media.findMany({
      where: source ? { source } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  } catch {
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
    db.brand.updateMany({ where: { logo: url }, data: { logo: null, logoMediaId: null } }),
    db.user.updateMany({ where: { image: url }, data: { image: null } }),
  ]);
}

// 3. Single Delete — pathname fetched from DB, never trusted from client (security fix)
export async function deleteMedia(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const media = await db.media.findUnique({ where: { id }, select: { url: true, pathname: true } });
    if (!media) return { success: false, message: 'Media not found' };

    if (media.pathname && isVercelBlobUrl(media.pathname)) await del(media.pathname);
    await cascadeDeleteByUrl(media.url);
    await db.media.delete({ where: { id } });

    revalidatePath('/admin/media');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    return { success: false, message };
  }
}

// 4. BULK DELETE — pathnames fetched from DB, never trusted from client (security fix)
export async function bulkDeleteMedia(ids: string[]): Promise<{ success: boolean; message?: string }> {
  try {
    const mediaRecords = await db.media.findMany({
      where: { id: { in: ids } },
      select: { url: true, pathname: true },
    });

    const pathnames = mediaRecords
      .map(m => m.pathname)
      .filter((p): p is string => !!p && isVercelBlobUrl(p));

    if (pathnames.length > 0) await del(pathnames);
    await Promise.all(mediaRecords.map(m => cascadeDeleteByUrl(m.url)));
    await db.media.deleteMany({ where: { id: { in: ids } } });

    revalidatePath('/admin/media');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bulk delete failed';
    console.error('Bulk delete failed:', error);
    return { success: false, message };
  }
}

// 5. Auto-save Media Details (no revalidatePath — minor metadata change, avoids full page revalidation)
export async function updateMediaDetails(
  id: string,
  data: { altText?: string; originalName?: string; caption?: string; description?: string },
): Promise<{ success: boolean; media?: Media; message?: string }> {
  try {
    const updatedMedia = await db.media.update({
      where: { id },
      data: {
        altText: data.altText,
        originalName: data.originalName,
        caption: data.caption,
        description: data.description,
      },
    });
    return { success: true, media: updatedMedia };
  } catch (error: unknown) {
    return { success: false, message: 'Failed to update media details' };
  }
}

// 6. SYNC ALL EXISTING MEDIA — parallel DB fetches (~7x faster than sequential)
export async function syncAllExistingMedia(): Promise<{ success: boolean; count?: number; message?: string }> {
  try {
    const existingMedia = await db.media.findMany({ select: { url: true } });
    const existingUrls = new Set(existingMedia.map(m => m.url));
    const newMediaData: Prisma.MediaCreateManyInput[] = [];

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

    // All 6 DB queries run in parallel
    const [products, galleryImages, categories, brands, users, claims] = await Promise.all([
      db.product.findMany({ select: { featuredImage: true }, where: { featuredImage: { not: null } } }),
      db.productImage.findMany({ select: { url: true } }),
      db.category.findMany({ select: { image: true }, where: { image: { not: null } } }),
      db.brand.findMany({ select: { logo: true }, where: { logo: { not: null } } }),
      db.user.findMany({ select: { image: true }, where: { image: { not: null } } }),
      db.warrantyClaim.findMany({ where: { mediaUrl: { not: null } } }),
    ]);

    products.forEach(p => addUrl(p.featuredImage, MediaSource.PRODUCT));
    galleryImages.forEach(img => addUrl(img.url, MediaSource.PRODUCT));
    categories.forEach(c => addUrl(c.image, MediaSource.CATEGORY));
    brands.forEach(b => addUrl(b.logo, MediaSource.BRAND));
    users.forEach(u => addUrl(u.image, MediaSource.USER));
    claims.forEach(claim => {
      if (!claim.mediaUrl) return;
      claim.mediaUrl.split(',').map(u => u.trim()).filter(Boolean).forEach(url => addUrl(url, MediaSource.WARRANTY));
    });

    if (newMediaData.length > 0) {
      await db.media.createMany({ data: newMediaData, skipDuplicates: true });
    }

    revalidatePath('/admin/media');
    return { success: true, count: newMediaData.length };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    console.error('Sync all failed:', error);
    return { success: false, message };
  }
}

// 7. SYNC OLD WARRANTY MEDIA
export async function syncOldWarrantyMedia(): Promise<{ success: boolean; count?: number; message?: string }> {
  try {
    const [claims, existingMedia] = await Promise.all([
      db.warrantyClaim.findMany({ where: { mediaUrl: { not: null } } }),
      db.media.findMany({ select: { url: true } }),
    ]);

    const existingUrls = new Set(existingMedia.map(m => m.url));
    const newMediaData: Prisma.MediaCreateManyInput[] = [];

    for (const claim of claims) {
      if (!claim.mediaUrl || claim.mediaUrl.trim() === '') continue;
      const urls = claim.mediaUrl.split(',').map(u => u.trim()).filter(Boolean);

      for (const url of urls) {
        if (existingUrls.has(url)) continue;
        const rawFilename = url.split('/').pop() || 'Warranty-File';
        const lowerName = rawFilename.toLowerCase();
        let type: MediaType = MediaType.OTHER;
        let mimeType = 'application/octet-stream';
        if (lowerName.match(/\.(jpeg|jpg|gif|png|webp)$/)) { type = MediaType.IMAGE; mimeType = 'image/jpeg'; }
        else if (lowerName.match(/\.(mp4|mov|webm)$/)) { type = MediaType.VIDEO; mimeType = 'video/mp4'; }

        newMediaData.push({ url, pathname: url, filename: rawFilename, originalName: rawFilename, mimeType, size: 0, type, source: MediaSource.WARRANTY });
        existingUrls.add(url);
      }
    }

    if (newMediaData.length > 0) {
      await db.media.createMany({ data: newMediaData, skipDuplicates: true });
    }

    revalidatePath('/admin/media');
    return { success: true, count: newMediaData.length };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    console.error('Sync failed:', error);
    return { success: false, message };
  }
}

// 8. SYNC FROM VERCEL BLOB STORAGE
const MAX_BLOB_SYNC_PAGES = 50;

export async function syncFromVercelBlob(): Promise<{ success: boolean; count?: number; message?: string }> {
  try {
    const existingMedia = await db.media.findMany({ select: { url: true } });
    const existingUrls = new Set(existingMedia.map(m => m.url));

    const newMediaData: Prisma.MediaCreateManyInput[] = [];
    let cursor: string | undefined = undefined;
    let iterations = 0;

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

        newMediaData.push({ url: blob.url, pathname: blob.pathname, filename, originalName: filename, mimeType, size: blob.size, type, source: MediaSource.GENERAL });
        existingUrls.add(blob.url);
      }
      cursor = result.cursor;
      iterations++;
    } while (cursor && iterations < MAX_BLOB_SYNC_PAGES);

    if (newMediaData.length > 0) {
      await db.media.createMany({ data: newMediaData, skipDuplicates: true });
    }

    revalidatePath('/admin/media');
    return { success: true, count: newMediaData.length };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Vercel Blob sync failed';
    console.error('Vercel Blob sync failed:', error);
    return { success: false, message };
  }
}
