// lib/cloudinary-storage-classify.ts
// Client-safe (no `cloudinary` SDK import) — শুধু NEXT_PUBLIC_* cloud_name
// ব্যবহার করে একটা Media URL কোন storage-account-এর সেটা বের করে। এই
// cloud_name-গুলো এমনিতেও প্রতিটা public delivery URL-এ থাকে, তাই এগুলো
// client bundle-এ থাকা কোনো security ঝুঁকি না — শুধু cloud_name, api key/secret না।

export interface StorageOption {
  value: string; // filter-এর জন্য stable key
  label: string;
}

const CLOUDINARY_CLOUD_NAMES: { index: number; cloudName: string }[] = [
  { index: 0, cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '' },
  { index: 1, cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME1 ?? '' },
  { index: 2, cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME2 ?? '' },
].filter(a => a.cloudName);

export const STORAGE_OPTIONS: StorageOption[] = [
  ...CLOUDINARY_CLOUD_NAMES.map(a => ({ value: `cloudinary-${a.index}`, label: `Cloudinary ${a.index + 1}` })),
  { value: 'vercel-blob', label: 'Vercel Blob' },
  { value: 'other', label: 'Other / External' },
];

export function classifyStorage(url: string | null | undefined): string {
  if (!url) return 'other';
  if (url.includes('.public.blob.vercel-storage.com')) return 'vercel-blob';

  const cloudinaryMatch = url.match(/^https:\/\/res\.cloudinary\.com\/([^/]+)\//);
  if (cloudinaryMatch) {
    const found = CLOUDINARY_CLOUD_NAMES.find(a => a.cloudName === cloudinaryMatch[1]);
    return found ? `cloudinary-${found.index}` : 'other';
  }

  return 'other';
}
