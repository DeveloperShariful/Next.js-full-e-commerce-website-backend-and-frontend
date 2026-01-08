"use server";

export async function logPayPalDebug(clientId: string | null, isSandbox: boolean) {
    console.log("\n🛑 --- PAYPAL DEBUGGER (SERVER SIDE) ---");
    console.log("Time:", new Date().toISOString());
    console.log("Mode:", isSandbox ? "SANDBOX" : "LIVE");
    console.log("Received Client ID:", clientId ? `${clientId.substring(0, 5)}...${clientId.slice(-4)}` : "MISSING/NULL");
    console.log("ENV VAR CHECK (NEXT_PUBLIC_PAYPAL_CLIENT_ID):", process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? "EXISTS" : "MISSING");
    console.log("🛑 --------------------------------------\n");
    return { success: true };
}