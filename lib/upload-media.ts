// lib/upload-media.ts — client-side only (no server SDK imports).
//
// Policy: video files always go to Cloudinary (phone-recorded .mov/HEVC
// footage plays audio-only in Chrome/Edge — see the warranty-claims fix —
// and Cloudinary's automatic compression matters far more for large video
// than for images). Images stay on Vercel Blob, which is simpler and
// sufficient for admin-curated photos; the one carved-out exception is
// warranty-claim images, which go to Cloudinary too because they're
// customer/phone-sourced and occasionally arrive as HEIC.

export interface UploadedFile {
  url: string;
  pathname: string;
  filename: string;
  mimeType: string;
  size: number;
}

interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  resource_type: 'image' | 'video' | 'raw';
  bytes: number;
}

function cloudinaryDeliveryUrl(cloudName: string, publicId: string, version: number, resourceType: string): string {
  // Slash-chained (not comma-combined) — some callers (e.g. WarrantyClaim)
  // join multiple file URLs with a comma, so a comma inside the URL itself
  // would get misread as a second, garbage "file".
  if (resourceType === 'video') {
    return `https://res.cloudinary.com/${cloudName}/video/upload/q_auto/vc_auto/v${version}/${publicId}.mp4`;
  }
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto/q_auto/v${version}/${publicId}`;
}

// Uploads straight from the browser to Cloudinary (file never touches our
// server, so large videos don't hit Vercel's request body size limit) using
// a short-lived signature from /api/upload/cloudinary-sign.
//
// 🚀 Multi-account fallback (2026-09-01): if the account the server picked
// turns out to be over its limit anyway (proactive usage-check can be up to
// 10min stale — see lib/cloudinary.ts), the upload itself fails and this
// retries with that account excluded, asking the sign route for a different
// one. Only after every configured Cloudinary account has been tried does
// this throw — which is what makes uploadToCloudinaryOrFallback() below
// fall back to Vercel Blob, exactly as before.
export function uploadToCloudinary(
  file: File,
  folder: string,
  onProgress?: (pct: number) => void,
  excludeIndices: number[] = []
): Promise<UploadedFile> {
  return fetch('/api/upload/cloudinary-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, excludeIndices }),
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to get upload signature');
      return res.json();
    })
    .then(({ signature, timestamp, folder: signedFolder, apiKey, cloudName, accountIndex }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);
      formData.append('folder', signedFolder);

      return new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
          else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error('Upload network error'));
        xhr.send(formData);
      })
        .then((result): UploadedFile => {
          const url = cloudinaryDeliveryUrl(cloudName, result.public_id, result.version, result.resource_type);
          return {
            url,
            pathname: result.public_id, // not a Vercel Blob URL, so isVercelBlobUrl() correctly no-ops on delete
            filename: file.name,
            mimeType: result.resource_type === 'video' ? 'video/mp4' : file.type,
            size: result.bytes,
          };
        })
        .catch((err): Promise<UploadedFile> => {
          // MAX_RETRY একটা সেফটি ক্যাপ — কতগুলো account আসলে configure করা
          // আছে সেটা client-side কোড জানে না (lib/cloudinary.ts server-only,
          // এখানে import করা যাবে না)। আসল "সব account শেষ" চেক নিচেই হয়:
          // sign route account না পেলে 503 দেয়, আর সেটা catch হয় না (এই
          // .catch শুধু upload-এর ব্যর্থতা ধরে, sign-fetch-এর না) — তাই সেটা
          // সরাসরি এখান থেকে বাইরে propagate হয়ে uploadToCloudinaryOrFallback-কে
          // Vercel Blob fallback নিতে বলে।
          const MAX_RETRY = 5;
          const nextExclude = [...excludeIndices, accountIndex];
          if (nextExclude.length >= MAX_RETRY) throw err;
          console.warn(`[upload-media] Cloudinary account ${accountIndex} failed, trying next account:`, err);
          return uploadToCloudinary(file, folder, onProgress, nextExclude);
        });
    });
}

// Uploads to Vercel Blob via the existing client-upload token flow.
async function uploadToVercelBlob(file: File, onProgress?: (pct: number) => void): Promise<UploadedFile> {
  const { upload } = await import('@vercel/blob/client');
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    onUploadProgress: (p: { loaded: number; total: number }) => {
      onProgress?.(Math.round((p.loaded / p.total) * 100));
    },
  });
  return { url: blob.url, pathname: blob.pathname, filename: file.name, mimeType: file.type, size: file.size };
}

// Tries Cloudinary first; if it fails for ANY reason (free-plan credit
// limit hit, auth issue, network blip), falls back to Vercel Blob instead
// of blocking the upload entirely. That one file loses the codec/HEIC
// compatibility guarantee, but the customer/admin can still submit —
// never a hard failure just because Cloudinary's quota ran out.
export async function uploadToCloudinaryOrFallback(file: File, folder: string, onProgress?: (pct: number) => void): Promise<UploadedFile> {
  try {
    return await uploadToCloudinary(file, folder, onProgress);
  } catch (err) {
    console.error('[upload-media] Cloudinary upload failed, falling back to Vercel Blob:', err);
    return uploadToVercelBlob(file, onProgress);
  }
}

// The router every general upload UI should call: video -> Cloudinary
// (falling back to Vercel Blob if Cloudinary is unavailable), everything
// else -> Vercel Blob directly.
export function uploadMediaFile(file: File, cloudinaryFolder: string, onProgress?: (pct: number) => void): Promise<UploadedFile> {
  if (file.type.startsWith('video/')) {
    return uploadToCloudinaryOrFallback(file, cloudinaryFolder, onProgress);
  }
  return uploadToVercelBlob(file, onProgress);
}
