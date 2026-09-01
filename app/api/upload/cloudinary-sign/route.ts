import { NextResponse } from 'next/server';
import { cloudinary, pickCloudinaryAccount } from '@/lib/cloudinary';

// Generic signer for any direct browser -> Cloudinary upload (not just
// warranty claims) — see lib/upload-media.ts. Video files always go through
// this (codec/format compatibility — see warranty-claims fix), images stay
// on Vercel Blob (/api/upload) unless the caller has its own reason not to.
//
// 🚀 Multi-account fallback (2026-09-01): a free-plan account's monthly
// credit limit can run out mid-month. The client can pass `excludeIndices`
// (accounts it already tried and failed against, from a previous call) so
// this route picks a different account instead of signing for the same
// exhausted one again. See lib/cloudinary.ts for the selection logic.
export async function POST(request: Request) {
  try {
    const { folder, excludeIndices } = await request.json().catch(() => ({ folder: undefined, excludeIndices: [] }));
    const timestamp = Math.round(Date.now() / 1000);
    const targetFolder = typeof folder === 'string' && folder.trim() ? folder.trim() : 'general';

    const account = await pickCloudinaryAccount(Array.isArray(excludeIndices) ? excludeIndices : []);
    if (!account) {
      return NextResponse.json({ error: 'No Cloudinary account available' }, { status: 503 });
    }

    // api_sign_request takes api_secret directly as an argument, not from the
    // SDK's global config — so this works correctly per-account regardless
    // of which account the shared `cloudinary` singleton happens to be
    // configured with.
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: targetFolder },
      account.apiSecret
    );

    return NextResponse.json({
      signature,
      timestamp,
      folder: targetFolder,
      apiKey: account.apiKey,
      cloudName: account.cloudName,
      accountIndex: account.index,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sign upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
