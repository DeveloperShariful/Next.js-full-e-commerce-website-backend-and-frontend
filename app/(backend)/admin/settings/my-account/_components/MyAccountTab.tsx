"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Check, Eye, EyeOff } from "lucide-react";
import {
  getMyAccountTabVisibility,
  updateMyAccountTabVisibility,
} from "@/app/actions/backend/settings/my-account/my-account-actions";
import { TOGGLEABLE_TABS, type TabVisibility } from "@/app/actions/backend/settings/my-account/tab-config";

export default function MyAccountTab() {
  const [visibility, setVisibility] = useState<TabVisibility>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getMyAccountTabVisibility()
      .then(setVisibility)
      .catch(() => setMessage({ text: "Failed to load settings.", success: false }))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setSaved(false);
    setVisibility((prev) => ({ ...prev, [id]: prev[id] === false ? true : false }));
  };

  const handleSave = () => {
    setMessage(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateMyAccountTabVisibility(visibility);
      setMessage({ text: result.message, success: result.success });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#2271b1]" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-sm max-w-2xl">
      <div className="px-4 py-3 border-b border-[#c3c4c7] bg-[#f0f0f1]">
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">My Account — Tab Visibility</h2>
        <p className="text-[12px] text-[#50575e] mt-0.5">
          Control which sections customers see in their My Account dashboard. Dashboard &amp; Account
          Details are always visible.
        </p>
      </div>

      <div className="divide-y divide-[#f0f0f1]">
        {TOGGLEABLE_TABS.map((tab) => {
          const isVisible = visibility[tab.id] !== false;
          return (
            <div key={tab.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 text-[13px] text-[#1d2327]">
                {isVisible ? (
                  <Eye className="w-4 h-4 text-[#00a32a]" />
                ) : (
                  <EyeOff className="w-4 h-4 text-[#8c8f94]" />
                )}
                {tab.label}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isVisible}
                onClick={() => toggle(tab.id)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isVisible ? "bg-[#2271b1]" : "bg-[#c3c4c7]"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    isVisible ? "translate-x-[18px]" : "translate-x-[3px]"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-[#c3c4c7] bg-[#f6f7f7] flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2271b1] text-white text-[13px] font-semibold rounded-sm hover:bg-[#135e96] transition-colors disabled:opacity-60"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? "Saving..." : "Save Changes"}
        </button>
        {saved && !isPending && (
          <span className="inline-flex items-center gap-1 text-[12px] text-[#00a32a]">
            <Check className="w-4 h-4" /> Saved
          </span>
        )}
        {message && !message.success && (
          <span className="text-[12px] text-[#d63638]">{message.text}</span>
        )}
      </div>
    </div>
  );
}
