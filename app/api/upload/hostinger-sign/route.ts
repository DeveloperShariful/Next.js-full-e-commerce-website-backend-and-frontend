import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Signer for direct browser -> Hostinger (media.gobike.au) uploads. Mirrors
// cloudinary-sign/route.ts's pattern: the static UPLOAD_SECRET never leaves
// the server — only a short-lived HMAC signature does, so it can't be stolen
// from devtools/network tab and reused indefinitely like a raw secret could.
export async function POST(request: Request) {
  try {
    const { folder } = await request.json().catch(() => ({ folder: undefined }));
    const targetFolder = typeof folder === 'string' && /^[a-z0-9_-]+$/i.test(folder) ? folder : 'general';
    const timestamp = Math.round(Date.now() / 1000);

    const secret = process.env.HOSTINGER_UPLOAD_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Hostinger upload not configured' }, { status: 503 });
    }

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}:${targetFolder}`)
      .digest('hex');

    return NextResponse.json({
      timestamp,
      signature,
      folder: targetFolder,
      uploadUrl: `${process.env.NEXT_PUBLIC_HOSTINGER_MEDIA_URL}/upload.php`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sign upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
