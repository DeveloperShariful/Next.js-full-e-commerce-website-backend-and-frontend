// lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

// Delivery URL that guarantees browser-compatible playback: forces an
// H.264/MP4 video (source phone footage is often HEVC .mov, which Chrome/
// Edge/Firefox on Windows can't decode — audio plays, video doesn't) or an
// auto-negotiated image format (covers HEIC photos the same way).
// Slash-chained transformations (not comma-combined, e.g. NOT "q_auto,vc_auto")
// — WarrantyClaim.mediaUrl stores multiple files as a comma-separated string
// (see [id]/page.tsx's `mediaUrl.split(',')`), so a comma inside the URL
// itself would get misread as a second, garbage "file".
export function cloudinaryDeliveryUrl(
  publicId: string,
  version: number,
  resourceType: "video" | "image"
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (resourceType === "video") {
    return `https://res.cloudinary.com/${cloudName}/video/upload/q_auto/vc_auto/v${version}/${publicId}.mp4`;
  }
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto/q_auto/v${version}/${publicId}`;
}
