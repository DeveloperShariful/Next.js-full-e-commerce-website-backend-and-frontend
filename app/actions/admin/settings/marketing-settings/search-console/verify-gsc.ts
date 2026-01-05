// File: app/actions/admin/settings/marketing-settings/search-console/verify-gsc.ts
"use server";

export async function verifySearchConsoleTag(verificationCode: string) {
  if (!verificationCode) return { success: false, message: "Verification code is missing." };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return { success: false, message: "System Error: NEXT_PUBLIC_APP_URL is not set in .env" };

  // Extract content if user pasted full tag: <meta name="..." content="XYZ" />
  let cleanCode = verificationCode;
  const match = verificationCode.match(/content=["']([^"']+)["']/);
  if (match && match[1]) {
    cleanCode = match[1];
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s Timeout (Pages can be slow)

  try {
    const response = await fetch(appUrl, { 
      method: "GET",
      signal: controller.signal,
      headers: {
        // Pretend to be a real browser to avoid blocks
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cache-Control": "no-cache"
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
        return { success: false, message: `Your website is unreachable (Status: ${response.status}).` };
    }

    const html = await response.text();
    
    // Strict Check: Look for the specific meta tag structure
    const hasTag = html.includes(cleanCode);

    if (hasTag) {
      return { success: true, message: "Verification Tag found on Homepage!" };
    } else {
      return { success: false, message: "Tag NOT found. Did you save the layout file? Clear cache." };
    }

  } catch (error: any) {
    clearTimeout(timeoutId);
    return { success: false, message: `Verification Failed: ${error.message}` };
  }
}