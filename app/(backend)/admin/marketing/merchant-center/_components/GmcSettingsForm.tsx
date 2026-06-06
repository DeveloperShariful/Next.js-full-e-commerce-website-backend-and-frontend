//File Path: app/(backend)/admin/marketing/merchant-center/_components/GmcSettingsForm.tsx

"use client";

import { useTransition, useState } from "react";
import { updateGmcSettings, GmcSettingsData } from "@/app/actions/backend/merchant-center/gmc-settings.actions";

// ==========================================
// 🌍 GOOGLE SUPPORTED COUNTRIES & LANGUAGES (CONSTANTS)
// ==========================================
const SUPPORTED_COUNTRIES = [
  { code: "AU", name: "Australia" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "NZ", name: "New Zealand" },
  { code: "IE", name: "Ireland" },
  { code: "IN", name: "India" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "AE", name: "United Arab Emirates" },
  // আপনি চাইলে এখানে আরও দেশ অ্যাড করতে পারেন
];

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
];

interface Props {
  initialData: any;
  disabled: boolean;
}

export default function GmcSettingsForm({ initialData, disabled }: Props) {
  const [isPending, startTransition] = useTransition();
  
  // ডাটাবেস থেকে আসা আসল ডাটা দিয়ে ফর্ম ইনিশিয়ালাইজ করা হচ্ছে
  const [formData, setFormData] = useState<GmcSettingsData>({
    gmcContentApiEnabled: initialData?.gmcContentApiEnabled || false,
    gmcMerchantId: initialData?.gmcMerchantId || "",
    gmcTargetCountry: initialData?.gmcTargetCountry || "AU",
    gmcLanguage: initialData?.gmcLanguage || "en",
  });
  
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await updateGmcSettings(formData);
      if (result.success) {
        setMessage({ type: "success", text: "Settings saved successfully." });
        setTimeout(() => setMessage(null), 3000); 
      } else {
        setMessage({ type: "error", text: result.error || "Failed to save." });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className={disabled ? "opacity-60 pointer-events-none" : ""}>
      
      {!disabled && message && (
        <div className={`p-3 mb-4 text-[13px] border-l-4 ${message.type === "success" ? "border-[#00a32a] bg-[#f0f6ea]" : "border-[#d63638] bg-[#fcf0f1]"}`}>
          {message.text}
        </div>
      )}

      {disabled && (
        <div className="p-3 mb-5 text-[13px] text-[#856404] bg-[#fff3cd] border-l-4 border-[#ffeeba]">
          Please connect your Google account first to edit settings.
        </div>
      )}

      <table className="w-full text-left border-collapse">
        <tbody>
          {/* Enable API Checkbox */}
          <tr>
            <th className="py-4 align-top w-[200px] text-[13px] font-semibold text-[#1d2327]">
              Enable integration
            </th>
            <td className="py-4 align-top">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.gmcContentApiEnabled}
                  onChange={(e) => setFormData({ ...formData, gmcContentApiEnabled: e.target.checked })}
                  className="w-4 h-4 border-[#8c8f94] rounded-[3px] text-[#2271b1] focus:ring-[#2271b1]"
                />
                <span className="text-[13px]">Enable Content API Product Sync</span>
              </label>
            </td>
          </tr>

          {/* Merchant Center ID */}
          <tr>
            <th className="py-4 align-top w-[200px] text-[13px] font-semibold text-[#1d2327]">
              Merchant Center ID <span className="text-[#d63638]">*</span>
            </th>
            <td className="py-4 align-top">
              <input
                type="text"
                required
                value={formData.gmcMerchantId}
                onChange={(e) => setFormData({ ...formData, gmcMerchantId: e.target.value })}
                placeholder="e.g. 123456789"
                className="w-full max-w-[350px] border border-[#8c8f94] rounded-[3px] px-2 py-1.5 text-[13px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-none bg-[#f6f7f7]"
                readOnly // যেহেতু উইজার্ডে একবার সিলেক্ট করা হয়েছে, তাই এটি readOnly রাখাই সেফ
              />
              <p className="text-[12px] text-[#646970] mt-1">This ID was selected during onboarding.</p>
            </td>
          </tr>

          {/* 🚀 DYNAMIC TARGET COUNTRY */}
          <tr>
            <th className="py-4 align-top w-[200px] text-[13px] font-semibold text-[#1d2327]">
              Target Country
            </th>
            <td className="py-4 align-top">
              <select
                value={formData.gmcTargetCountry}
                onChange={(e) => setFormData({ ...formData, gmcTargetCountry: e.target.value })}
                className="w-full max-w-[350px] border border-[#8c8f94] rounded-[3px] px-2 py-1.5 text-[13px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-none bg-white cursor-pointer"
              >
                {SUPPORTED_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
              <p className="text-[12px] text-[#646970] mt-1">The primary country where your products are sold and shipped.</p>
            </td>
          </tr>

          {/* 🚀 DYNAMIC CONTENT LANGUAGE */}
          <tr>
            <th className="py-4 align-top w-[200px] text-[13px] font-semibold text-[#1d2327] border-b-0">
              Content Language
            </th>
            <td className="py-4 align-top border-b-0">
              <select
                value={formData.gmcLanguage}
                onChange={(e) => setFormData({ ...formData, gmcLanguage: e.target.value })}
                className="w-full max-w-[350px] border border-[#8c8f94] rounded-[3px] px-2 py-1.5 text-[13px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-none bg-white cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.code})
                  </option>
                ))}
              </select>
              <p className="text-[12px] text-[#646970] mt-1">The language your product titles and descriptions are written in.</p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Submit Button */}
      <div className="mt-6 pt-4 border-t border-[#ccd0d4]">
        <button
          type="submit"
          disabled={isPending}
          className="bg-[#2271b1] hover:bg-[#135e96] text-white border border-[#2271b1] rounded-[3px] px-4 py-1.5 text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
        >
          {isPending ? "Saving changes..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}