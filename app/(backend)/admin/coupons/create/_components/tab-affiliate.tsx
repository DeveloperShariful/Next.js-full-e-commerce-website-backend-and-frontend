// File Location: app/(backend)/admin/coupons/create/_components/tab-affiliate.tsx

"use client";

import { useState } from "react";
import { HelpCircle, Loader2, X, User, Percent } from "lucide-react";
import { CouponFormType } from "../../types";
import { searchAffiliatesForCoupon } from "@/app/actions/backend/coupon/search-resources";

interface AffiliateResult {
  id: string;
  name: string;
}

interface TabAffiliateProps {
  formData: CouponFormType;
  updateField: (field: keyof CouponFormType, value: CouponFormType[keyof CouponFormType]) => void;
}

const TooltipHelp = ({ text }: { text: string }) => (
  <span className="text-[#a7aaad] hover:text-[#3c434a] cursor-help shrink-0" title={text}>
    <HelpCircle size={14} />
  </span>
);

export const TabAffiliate = ({ formData, updateField }: TabAffiliateProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AffiliateResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length > 1) {
      setSearching(true);
      const res = await searchAffiliatesForCoupon(val);
      setResults(res);
      setSearching(false);
    } else {
      setResults([]);
    }
  };

  const selectAffiliate = (aff: AffiliateResult) => {
    updateField("affiliateId", aff.id);
    setSelectedName(aff.name);
    setQuery("");
    setResults([]);
  };

  const clearAffiliate = () => {
    updateField("affiliateId", null);
    setSelectedName(null);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      <p className="text-[#646970] text-[13px] leading-relaxed m-0">
        Assign this coupon to an affiliate account. When a customer uses this code,
        the affiliate earns commission. You can also override the global commission rate for this coupon.
      </p>

      {/* Affiliate Account Search */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
        <label className="sm:w-[160px] font-medium text-[#2c3338] mt-1">Affiliate account</label>
        <div className="flex-1 flex items-start gap-2">
          <div className="w-full max-w-[400px]">

            {formData.affiliateId && selectedName ? (
              <div className="flex items-center gap-2 h-[30px] px-3 border border-[#8c8f94] bg-[#f0f6fc] rounded-[3px] shadow-sm">
                <User size={13} className="text-[#2271b1] shrink-0" />
                <span className="text-[13px] font-medium text-[#1d2327] flex-1 truncate">{selectedName}</span>
                <button
                  type="button"
                  onClick={clearAffiliate}
                  className="text-[#a7aaad] hover:text-[#d63638] transition-colors shrink-0"
                  title="Remove affiliate"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full h-[30px] px-3 border border-[#8c8f94] bg-white rounded-[3px] outline-none shadow-sm focus:border-[#2271b1] text-[13px]"
                />
                {searching && (
                  <Loader2 size={14} className="absolute right-2 top-2 animate-spin text-[#2271b1]" />
                )}
                {results.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-[#2271b1] shadow-lg max-h-48 overflow-y-auto mt-1 rounded-[3px]">
                    {results.map((aff) => (
                      <div
                        key={aff.id}
                        onClick={() => selectAffiliate(aff)}
                        className="px-3 py-2 text-[12px] hover:bg-[#f0f6fc] cursor-pointer border-b border-[#f0f0f1] last:border-0 flex items-center gap-2 transition-colors"
                      >
                        <User size={12} className="text-[#646970] shrink-0" />
                        <span className="text-[#1d2327]">{aff.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {query.length > 1 && results.length === 0 && !searching && (
                  <div className="absolute z-50 w-full bg-white border border-[#c3c4c7] shadow-lg mt-1 rounded-[3px] px-3 py-2 text-[12px] text-[#646970]">
                    No affiliates found.
                  </div>
                )}
              </div>
            )}

          </div>
          <TooltipHelp text="Assign this coupon to an affiliate. The affiliate earns commission whenever this code is used at checkout." />
        </div>
      </div>

      {/* Commission Rate Override */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
        <label className="sm:w-[160px] font-medium text-[#2c3338]">Commission override</label>
        <div className="flex-1 flex items-center gap-2">
          <div className="relative w-full max-w-[200px]">
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.affiliateCommissionRate}
              onChange={(e) =>
                updateField("affiliateCommissionRate", parseFloat(e.target.value) || "")
              }
              placeholder="Use global rate"
              className="w-full h-[30px] pl-3 pr-8 border border-[#8c8f94] bg-white rounded-[3px] outline-none shadow-sm focus:border-[#2271b1] text-[13px]"
            />
            <Percent size={12} className="absolute right-2.5 top-[9px] text-[#8c8f94]" />
          </div>
          <TooltipHelp text="Override the global affiliate commission rate for this specific coupon. Leave blank to use the program's default rate." />
        </div>
      </div>

      {/* Informational note */}
      {!formData.affiliateId && (
        <div className="bg-[#f0f6fc] border border-[#c2d7ef] rounded-[3px] px-4 py-3 text-[12px] text-[#2271b1] leading-relaxed">
          <strong>Note:</strong> Assign an affiliate account above to track commission earnings for this coupon.
          Once assigned, the affiliate will earn commission whenever this coupon code is used at checkout.
        </div>
      )}

      {formData.affiliateId && (
        <div className="bg-[#f0f6f0] border border-[#8fbc8f] rounded-[3px] px-4 py-3 text-[12px] text-[#2d6a2d] leading-relaxed">
          <strong>Affiliate linked.</strong> Commission will be credited to this affiliate for every successful order using this coupon.
          {formData.affiliateCommissionRate !== "" ? (
            <span> Custom rate: <strong>{formData.affiliateCommissionRate}%</strong>.</span>
          ) : (
            <span> Using the program&apos;s global commission rate.</span>
          )}
        </div>
      )}

    </div>
  );
};
