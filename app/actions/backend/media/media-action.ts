// app/actions/backend/media-action.ts

'use server';

import { db } from '@/lib/prisma';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { del, list, type ListBlobResult } from '@vercel/blob';
import { fetchAllCloudinaryUsage, CLOUDINARY_ACCOUNTS, type CloudinaryAccountUsage } from '@/lib/cloudinary';
import { Media, MediaType, MediaSource, Prisma } from '@prisma/client';

// 1. Save uploaded file info
export async function saveMediaRecord(data: {
  url: string;
  pathname: string;
  filename: string;
  mimeType: string;
  size: number;
  source?: MediaSource;
  qualityScore?: number;
  originalSize?: number;
  transcodePending?: boolean;
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
        qualityScore: data.qualityScore ?? null,
        originalSize: data.originalSize ?? null,
        transcodePending: data.transcodePending ?? false,
      },
    });

    revalidatePath('/admin/media');
    revalidateTag('admin-media', 'default');
    revalidateTag('storage-usage', 'default');
    return { success: true, media: newMedia };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save media record';
    console.error('Failed to save media record:', error);
    return { success: false, message };
  }
}

// 2. Fetch all media — cached for 5 min, invalidated by all write operations
async function _getAllMedia(source?: MediaSource): Promise<Media[]> {
  try {
    return await db.media.findMany({
      where: source ? { source } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    return [];
  }
}

export const getAllMedia = unstable_cache(
  _getAllMedia,
  ['admin-media'],
  { revalidate: 300, tags: ['admin-media'] }
);

// Media Library page only (NOT MediaPickerModal — a blog/product image picker
// showing customers' own community photos would be wrong). Read-only merge:
// real Media rows plus PostMedia (community post attachments) synthesized
// into the same shape so they're browsable/searchable/filterable together.
// PostMedia intentionally stays its own table (order + cascade-delete tied
// to one post — see lib/cloudinary.ts-style comments elsewhere in this
// codebase for the reasoning) — this does NOT write anything back to Media,
// it only reads PostMedia alongside it. isReadOnly marks these so the UI
// hides edit/delete for them (managed from the Community section instead).
export interface MediaLibraryItem {
  id: string;
  url: string;
  type: MediaType;
  filename: string;
  originalName: string | null;
  publicId: string | null;
  pathname: string | null;
  source: string; // MediaSource value, or 'COMMUNITY' for the synthesized rows below
  width: number | null;
  height: number | null;
  mimeType: string;
  size: number;
  altText: string | null;
  caption: string | null;
  description: string | null;
  qualityScore: number | null;
  originalSize: number | null;
  transcodePending: boolean;
  folderId: string | null;
  uploadedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  isReadOnly?: boolean;
  communityPostId?: string;
}

async function _getMediaLibraryItems(): Promise<MediaLibraryItem[]> {
  const [media, postMedia] = await Promise.all([
    db.media.findMany({ orderBy: { createdAt: 'desc' } }),
    db.postMedia.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  const mediaItems: MediaLibraryItem[] = media.map((m) => ({ ...m }));

  const communityItems: MediaLibraryItem[] = postMedia.map((p) => {
    const filename = p.url.split('/').pop() || 'community-media';
    return {
      id: `postmedia-${p.id}`,
      url: p.url,
      type: p.mediaType,
      filename,
      originalName: null,
      publicId: null,
      pathname: p.url,
      source: 'COMMUNITY',
      width: null,
      height: null,
      // PostMedia doesn't store mime type — best-effort guess from mediaType,
      // only used for the grid/modal's image-vs-video branching, never for
      // real upload processing.
      mimeType: p.mediaType === 'VIDEO' ? 'video/mp4' : 'image/webp',
      size: 0, // not tracked on PostMedia — excluded from storage totals below
      altText: null,
      caption: null,
      description: null,
      qualityScore: null,
      originalSize: null,
      transcodePending: false,
      folderId: null,
      uploadedBy: null,
      createdAt: p.createdAt,
      updatedAt: p.createdAt,
      isReadOnly: true,
      communityPostId: p.postId,
    };
  });

  return [...mediaItems, ...communityItems].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export const getMediaLibraryItems = unstable_cache(
  _getMediaLibraryItems,
  ['admin-media-library'],
  { revalidate: 300, tags: ['admin-media', 'community-posts'] }
);

// On-demand file size for the community read-only rows above (PostMedia
// doesn't store size, so it comes back as 0 there). Called only when the
// Attachment Details modal opens for one such item — not upfront for the
// whole grid, which could mean hundreds of requests. Runs server-side
// specifically to avoid the browser CORS restrictions a client-side HEAD
// fetch to a different-origin host (media.gobike.au, Cloudinary, Vercel
// Blob) would hit.
export async function getRemoteFileSize(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const len = res.headers.get('content-length');
    return len ? parseInt(len, 10) : null;
  } catch {
    return null;
  }
}

const isVercelBlobUrl = (url: string) => url.includes('.public.blob.vercel-storage.com');
const isCloudinaryUrl = (url: string) => url.includes('res.cloudinary.com');
const isHostingerUrl = (url: string) => url.includes('media.gobike.au');

// আমাদের নিজস্ব Hostinger media সার্ভার থেকে ফাইল ডিলিট — delete.php-কে static
// secret দিয়ে কল করা হয় (এই ফাংশন server-only 'use server' ফাইলে, browser-এ
// কখনো যায় না, তাই signature-এর দরকার নাই — upload.php-র মতো)।
async function deleteFromHostinger(url: string) {
  const relPath = url.split('/uploads/')[1];
  if (!relPath) return;
  const secret = process.env.HOSTINGER_UPLOAD_SECRET;
  if (!secret) {
    console.error('Hostinger delete skipped — HOSTINGER_UPLOAD_SECRET not configured');
    return;
  }
  await fetch(`${process.env.NEXT_PUBLIC_HOSTINGER_MEDIA_URL}/delete.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-upload-secret': secret },
    body: JSON.stringify({ path: relPath }),
  }).catch(err => console.error('Hostinger delete failed for', url, err));
}

// Recovers {cloudName, publicId, resourceType} from our own delivery URL
// shape (see lib/cloudinary.ts / lib/upload-media.ts) so a deleted Media
// row's file actually gets removed from Cloudinary too, not just the DB.
// cloudName-টা দরকার কারণ multi-account fallback-এর পর একটা ফাইল account
// 0/1/2 — যেকোনোটাতেই থাকতে পারে, শুধু account 0-এর credential দিয়ে delete
// চেষ্টা করলে ভিন্ন account-এর ফাইল silently delete হবে না।
function parseCloudinaryUrl(url: string): { cloudName: string; publicId: string; resourceType: 'image' | 'video' } | null {
  const cloudNameMatch = url.match(/^https:\/\/res\.cloudinary\.com\/([^/]+)\//);
  if (!cloudNameMatch) return null;
  const cloudName = cloudNameMatch[1];

  const videoMatch = url.match(/\/video\/upload\/.+\/v\d+\/(.+)\.[a-zA-Z0-9]+$/);
  if (videoMatch) return { cloudName, publicId: videoMatch[1], resourceType: 'video' };

  const imageMatch = url.match(/\/image\/upload\/.+\/v\d+\/(.+)$/);
  if (imageMatch) return { cloudName, publicId: imageMatch[1], resourceType: 'image' };

  return null;
}

async function deleteFromCloudinary(url: string) {
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return;

  const account = CLOUDINARY_ACCOUNTS.find(a => a.cloudName === parsed.cloudName);
  if (!account) {
    console.error('Cloudinary delete skipped — no matching account configured for', url);
    return;
  }

  // cloudinary SDK-র destroy()-এর TypeScript টাইপ per-call credential override
  // নেয় না (যদিও runtime-এ কাজ করে) — as any এড়াতে সরাসরি Admin API-তে fetch,
  // ঠিক fetchCloudinaryUsage()-এর মতোই প্যাটার্নে, যাতে সঠিক account-এর
  // credential দিয়েই ডিলিট হয়।
  const auth = Buffer.from(`${account.apiKey}:${account.apiSecret}`).toString('base64');
  const params = new URLSearchParams({ 'public_ids[]': parsed.publicId });
  await fetch(
    `https://api.cloudinary.com/v1_1/${account.cloudName}/resources/${parsed.resourceType}/upload?${params.toString()}`,
    { method: 'DELETE', headers: { Authorization: `Basic ${auth}` } }
  ).catch(err => console.error('Cloudinary delete failed for', url, err));
}

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
    else if (isCloudinaryUrl(media.url)) await deleteFromCloudinary(media.url);
    else if (isHostingerUrl(media.url)) await deleteFromHostinger(media.url);
    await cascadeDeleteByUrl(media.url);
    await db.media.delete({ where: { id } });

    revalidatePath('/admin/media');
    revalidateTag('admin-media', 'default');
    revalidateTag('storage-usage', 'default');
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
    const cloudinaryUrls = mediaRecords
      .map(m => m.url)
      .filter(isCloudinaryUrl);
    const hostingerUrls = mediaRecords
      .map(m => m.url)
      .filter(isHostingerUrl);

    if (pathnames.length > 0) await del(pathnames);
    await Promise.all(cloudinaryUrls.map(deleteFromCloudinary));
    await Promise.all(hostingerUrls.map(deleteFromHostinger));
    await Promise.all(mediaRecords.map(m => cascadeDeleteByUrl(m.url)));
    await db.media.deleteMany({ where: { id: { in: ids } } });

    revalidatePath('/admin/media');
    revalidateTag('admin-media', 'default');
    revalidateTag('storage-usage', 'default');
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
    revalidateTag('admin-media', 'default');
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
    revalidateTag('admin-media', 'default');
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
    revalidateTag('admin-media', 'default');
    return { success: true, count: newMediaData.length };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Vercel Blob sync failed';
    console.error('Vercel Blob sync failed:', error);
    return { success: false, message };
  }
}

// 9. STORAGE USAGE — every configured Cloudinary account's usage (each has
// its own plan/credit limit — see lib/cloudinary.ts for the multi-account
// fallback this feeds) + Vercel Blob total size (no account-level quota
// available without a separate Vercel API token, so this side is usage-only,
// no limit).
export interface StorageUsage {
  hostinger: {
    totalBytes: number;
    fileCount: number;
  } | null;
  cloudinaryAccounts: CloudinaryAccountUsage[];
  vercelBlob: {
    totalBytes: number;
    fileCount: number;
  } | null;
}

// আমাদের নিজস্ব Hostinger media সার্ভারের uploads/ ফোল্ডারের usage — server.js-এর
// /stats endpoint থেকে (stats.php দিয়ে proxy হয়ে)।
async function fetchHostingerUsage(): Promise<{ totalBytes: number; fileCount: number } | null> {
  const secret = process.env.HOSTINGER_UPLOAD_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_HOSTINGER_MEDIA_URL;
  if (!secret || !baseUrl) return null;
  try {
    const res = await fetch(`${baseUrl}/stats.php`, {
      headers: { 'x-upload-secret': secret },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { totalBytes: data.totalBytes ?? 0, fileCount: data.fileCount ?? 0 };
  } catch {
    return null;
  }
}

async function _getStorageUsage(): Promise<StorageUsage> {
  const [hostinger, cloudinaryAccounts, vercelResult] = await Promise.all([
    fetchHostingerUsage(),
    fetchAllCloudinaryUsage(),
    (async () => {
      let totalBytes = 0;
      let fileCount = 0;
      let cursor: string | undefined;
      let iterations = 0;
      do {
        const result: ListBlobResult = await list({ cursor, limit: 1000 });
        for (const blob of result.blobs) {
          totalBytes += blob.size;
          fileCount++;
        }
        cursor = result.cursor;
        iterations++;
      } while (cursor && iterations < MAX_BLOB_SYNC_PAGES);
      return { totalBytes, fileCount };
    })().catch(() => null),
  ]);

  return { hostinger, cloudinaryAccounts, vercelBlob: vercelResult };
}

// External API calls (Cloudinary + full Vercel Blob listing) — cached 10min
// so the media page doesn't hit both on every single render. Tagged so
// delete/upload actions can force a fresh read instead of waiting out the
// full 10 minutes.
export const getStorageUsage = unstable_cache(
  _getStorageUsage,
  ['storage-usage'],
  { revalidate: 600, tags: ['storage-usage'] }
);
