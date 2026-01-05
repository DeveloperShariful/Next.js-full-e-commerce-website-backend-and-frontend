// File: app/actions/admin/settings/marketing-settings/facebook/verify-fb.ts
"use server";

export async function verifyFacebookCapi(pixelId: string, accessToken: string) {
  if (!pixelId || !accessToken) return { success: false, message: "Missing Pixel ID or Access Token." };

  try {
    const url = `https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`;
    
    // Send a real "Test" event
    const payload = {
      data: [
        {
          event_name: "TestConnection",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          user_data: { client_user_agent: "GoBike-Admin-Verifier" }
        }
      ],
      test_event_code: "TEST12345" // Optional: Just to ensure it doesn't mess up analytics
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, message: `Connected! FB Accepted Event. (Trace ID: ${data.fbtrace_id})` };
    } else {
      // Handle Facebook Specific Errors
      const error = data.error;
      let msg = error.message;

      if (error.code === 190) msg = "Access Token has expired or is invalid.";
      if (error.code === 100) msg = "Invalid Pixel ID provided.";
      if (error.code === 4) msg = "Application request limit reached. Wait a bit.";

      return { success: false, message: `FB Error: ${msg}` };
    }

  } catch (error: any) {
    return { success: false, message: `Network Error: ${error.message}` };
  }
}