// File: app/actions/admin/settings/marketing-settings/tag-manager/verify-gtm.ts
"use server";

export async function verifyGtmContainer(containerId: string) {
  if (!containerId) return { success: false, message: "Container ID is missing." };
  if (!containerId.startsWith("GTM-")) return { success: false, message: "Invalid ID format. Must start with 'GTM-'." };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s Timeout

  try {
    const url = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
    
    const response = await fetch(url, { 
        method: "GET", // Changed to GET to verify content type
        signal: controller.signal 
    });

    clearTimeout(timeoutId);

    if (response.status === 200) {
        // Double check: ensure it's actually a JS file
        const contentType = response.headers.get("content-type");
        if (contentType && (contentType.includes("javascript") || contentType.includes("application/x-javascript"))) {
            return { success: true, message: "Container Found & Active (200 OK)" };
        }
        return { success: false, message: "ID exists but returned invalid content." };
    } else if (response.status === 404) {
        return { success: false, message: "GTM Container ID not found (404)." };
    } else {
        return { success: false, message: `Google returned error status: ${response.status}` };
    }

  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
        return { success: false, message: "Connection Timed Out. Google took too long to respond." };
    }
    return { success: false, message: "Network Error: Check internet connection." };
  }
}