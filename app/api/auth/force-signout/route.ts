// app/api/auth/force-signout/route.ts
//
// Used when a Server Component (e.g. admin/layout.tsx) determines the
// current session is invalid (deleted/banned user) and needs to send the
// browser to /sign-in. A plain `redirect()` from a Server Component can't
// clear cookies, so the stale session cookie would survive the redirect —
// middleware (proxy.ts) then sees that same stale cookie, thinks the user
// is still logged in, and bounces them straight back to /admin, causing an
// infinite redirect loop. This route actually clears the cookie first.

import { NextResponse } from "next/server";
import { signOut } from "@/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get("callbackUrl") || "/sign-in";

  await signOut({ redirect: false });

  return NextResponse.redirect(new URL(callbackUrl, request.url));
}
