//File Path: app/(backend)/admin/marketing/merchant-center/_components/GoogleConnectCard.tsx

"use client";

import { useTransition } from "react";
import { getGoogleAuthUrl, disconnectGoogleAccount } from "@/app/actions/backend/merchant-center/gmc-auth.actions";

interface Props {
  isConnected: boolean;
  accountEmail: string | null;
}

export default function GoogleConnectCard({ isConnected, accountEmail }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleConnect = () => {
    startTransition(async () => {
      const result = await getGoogleAuthUrl();
      if (result.success && result.url) {
        window.location.href = result.url; // Redirect to Google
      } else {
        alert(result.error || "Failed to generate connection URL.");
      }
    });
  };

  const handleDisconnect = () => {
    if (!confirm("Are you sure you want to disconnect? Product sync will stop working.")) return;
    
    startTransition(async () => {
      const result = await disconnectGoogleAccount();
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  return (
    <div className="bg-white border border-[#ccd0d4]">
      <h2 className="text-[14px] font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-4 py-3 m-0">
        Google Account
      </h2>
      <div className="p-4">
        {isConnected ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 bg-[#00a32a] rounded-full inline-block"></span>
              <p className="text-[13px] m-0 text-[#3c434a]">
                Connected as: <strong>{accountEmail}</strong>
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={isPending}
              className="text-[#d63638] hover:text-[#b32d2e] text-[13px] underline bg-transparent border-none p-0 cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Disconnecting..." : "Disconnect account"}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-[13px] text-[#50575e] mb-4 leading-relaxed">
              Connect your Google Account to automatically sync products to Google Merchant Center.
            </p>
            <button
              onClick={handleConnect}
              disabled={isPending}
              className="bg-[#2271b1] hover:bg-[#135e96] text-white border border-[#2271b1] rounded-[3px] px-4 py-1.5 text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? "Connecting..." : "Connect Google Account"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}