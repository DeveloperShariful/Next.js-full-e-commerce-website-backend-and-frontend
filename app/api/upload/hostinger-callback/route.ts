// app/api/upload/hostinger-callback/route.ts
//
// The Hostinger media server's background transcode worker calls this once
// a video finishes compressing (see server.js's "ASYNC VIDEO TRANSCODE
// QUEUE" — the URL itself never changes, only the file bytes get swapped in
// place, so this just needs to update the Media row's qualityScore/size/
// transcodePending to match). Server-to-server only (never reaches a
// browser), so the static shared secret is fine — same reasoning as the
// existing delete.php/stats.php bridges.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-upload-secret');
  if (!secret || secret !== process.env.HOSTINGER_UPLOAD_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as
    { url?: string; qualityScore?: number | null; size?: number; transcodePending?: boolean } | null;
  if (!body?.url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  try {
    const result = await db.media.updateMany({
      where: { url: body.url },
      data: {
        qualityScore: body.qualityScore ?? null,
        transcodePending: body.transcodePending ?? false,
        ...(body.size ? { size: body.size } : {}),
      },
    });

    revalidatePath('/admin/media');
    revalidateTag('admin-media', 'default');
    revalidateTag('storage-usage', 'default');

    return NextResponse.json({ success: true, updated: result.count });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed';
    console.error('[hostinger-callback] failed:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
