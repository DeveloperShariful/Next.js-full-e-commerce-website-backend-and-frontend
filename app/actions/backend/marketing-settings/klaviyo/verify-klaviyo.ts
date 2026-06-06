// File: app/actions/admin/settings/marketing-settings/klaviyo/verify-klaviyo.ts
"use server";

export async function verifyKlaviyoKey(privateKey: string) {
  if (!privateKey) return { success: false, message: "Private Key is required." };
  if (!privateKey.startsWith("pk_")) return { success: false, message: "Invalid Key Format. Must start with 'pk_'." };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    // Using the NEW Klaviyo API Endpoint with correct headers
    const url = "https://a.klaviyo.com/api/lists/";
    
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Authorization": `Klaviyo-API-Key ${privateKey}`,
        "revision": "2024-02-15", // ✅ CRITICAL: Must use a stable revision
        "accept": "application/json"
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: `Connected! Found ${data.data?.length || 0} lists.` };
    } else {
      // Parse Klaviyo Error
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) return { success: false, message: "Unauthorized: Invalid Private Key." };
      if (response.status === 403) return { success: false, message: "Permission Denied: Key doesn't have Lists scope." };
      
      return { 
        success: false, 
        message: errorData.errors?.[0]?.detail || `API Error: ${response.statusText}` 
      };
    }

  } catch (error: any) {
    clearTimeout(timeoutId);
    return { success: false, message: "Connection Failed. Check internet or Klaviyo status." };
  }
}