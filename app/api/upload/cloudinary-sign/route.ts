import { NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';

// Generic signer for any direct browser -> Cloudinary upload (not just
// warranty claims) — see lib/upload-media.ts. Video files always go through
// this (codec/format compatibility — see warranty-claims fix), images stay
// on Vercel Blob (/api/upload) unless the caller has its own reason not to.
export async function POST(request: Request) {
  try {
    const { folder } = await request.json().catch(() => ({ folder: undefined }));
    const timestamp = Math.round(Date.now() / 1000);
    const targetFolder = typeof folder === 'string' && folder.trim() ? folder.trim() : 'general';

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: targetFolder },
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      signature,
      timestamp,
      folder: targetFolder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sign upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
