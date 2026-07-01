"use client";

import { useState } from "react";
import { saveTransdirectPricing } from "@/app/actions/backend/settings/shipping/transdirect-config";
import { TransdirectConfig } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  config: TransdirectConfig | null;
  refreshData: () => void;
}

// Helper: "2.50" বা "5%" — ব্যবহারকারীকে কোনটা আছে সেটা দেখানো
function FeeHint() {
  return (
    <span className="text-[11px] text-[#646970] mt-1 block">
      Flat amount (e.g. <code className="bg-[#f6f7f7] px-1 rounded">2.50</code>) or percentage (e.g. <code className="bg-[#f6f7f7] px-1 rounded">5%</code>). Leave blank to skip.
    </span>
  );
}

export default function Transdirect_Pricing({ config, refreshData }: Props) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const form = e.target as HTMLFormElement;
    formData.set("debugMode", String((form["debugMode"] as HTMLInputElement).checked));

    const res = await saveTransdirectPricing(formData);
    if (res.success) {
      toast.success(res.message || "Pricing rules saved");
      refreshData();
    } else {
      toast.error(res.error || "Failed to save");
    }
    setLoading(false);
  };

  // WP-style table classes (same as Transdirect_Controls)
  const trClass  = "block md:table-row border-b border-[#f0f0f1] md:border-none pb-4 md:pb-0 mb-4 md:mb-0 align-top";
  const thClass  = "block md:table-cell w-full md:w-[250px] pt-[5px] md:py-[15px] pr-[10px] text-[13px] font-medium text-[#1d2327] mb-1 md:mb-0 align-top";
  const tdClass  = "block md:table-cell py-[5px] md:py-[15px] align-top";
  const inputSm  = "w-[130px] border border-[#8c8f94] rounded-[3px] px-[8px] py-[4px] text-[13px] text-[#3c434a] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1] text-center";
  const inputMd  = "w-[200px] border border-[#8c8f94] rounded-[3px] px-[8px] py-[4px] text-[13px] text-[#3c434a] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]";

  const s = config as any; // Prisma serialized — all Decimal already string via JSON.parse(JSON.stringify())

  return (
    <div className="w-full animate-in fade-in">
      <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none">
        Fees, Markups &amp; Discounts
      </h2>
      <p className="text-[12px] text-[#646970] mt-1 mb-4">
        Rules are applied in order: Global Discount → Handling Fee → Markup → Cart Discount.
      </p>

      <form onSubmit={handleSubmit}>
        <table className="w-full text-left border-collapse block md:table mb-[20px] mt-[10px]">
          <tbody className="block md:table-row-group">

            {/* ── Global Shipping Discount ───────────────────────── */}
            <tr className={trClass}>
              <th scope="row" className={thClass}>
                <label className="cursor-pointer">Global Shipping Discount</label>
                <span className="text-[11px] text-[#646970] font-normal block mt-1">
                  Applied to ALL quotes. No threshold.
                </span>
              </th>
              <td className={tdClass}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-2 bg-[#f6f7f7] border border-[#e2e4e7] rounded-[4px] px-3 py-2">
                    <span className="text-[12px] text-[#646970]">Apply discount of</span>
                    <input
                      type="text"
                      name="globalShippingDiscount"
                      defaultValue={s?.globalShippingDiscount ?? ""}
                      className={inputSm}
                      placeholder="e.g. 50% or 10"
                    />
                    <span className="text-[12px] text-[#646970]">on all raw quotes</span>
                  </span>
                </div>
                <FeeHint />
              </td>
            </tr>

            {/* ── Handling Fee ──────────────────────────────────── */}
            <tr className={trClass}>
              <th scope="row" className={thClass}>
                <label className="cursor-pointer">Handling Fee</label>
                <span className="text-[11px] text-[#646970] font-normal block mt-1">
                  Added to every quote after global discount.
                </span>
              </th>
              <td className={tdClass}>
                <input
                  type="text"
                  name="handlingFee"
                  defaultValue={s?.handlingFee ?? ""}
                  className={inputMd}
                  placeholder="e.g. 2.50 or 5%"
                />
                <FeeHint />
              </td>
            </tr>

            {/* ── Dynamic Markup Rules ──────────────────────────── */}
            <tr className={trClass}>
              <th scope="row" className={thClass}>
                <label>Dynamic Markup Rules</label>
                <span className="text-[11px] text-[#646970] font-normal block mt-1">
                  Cart subtotal checked top-down. First match wins.
                </span>
              </th>
              <td className={tdClass}>
                <div className="space-y-3">

                  {/* Rule 1 */}
                  <div className="flex items-center gap-2 flex-wrap bg-[#f6f7f7] border border-[#e2e4e7] rounded-[4px] px-3 py-2">
                    <span className="inline-flex items-center justify-center bg-[#2271b1] text-white text-[11px] font-semibold rounded-[3px] px-2 py-0.5 shrink-0">
                      Rule 1
                    </span>
                    <span className="text-[12px] text-[#646970]">If cart total is less than</span>
                    <input
                      type="text"
                      name="markupRule1Threshold"
                      defaultValue={s?.markupRule1Threshold ?? ""}
                      className={inputSm}
                      placeholder="e.g. 1200"
                    />
                    <span className="text-[12px] text-[#646970]">apply markup of</span>
                    <input
                      type="text"
                      name="markupRule1Fee"
                      defaultValue={s?.markupRule1Fee ?? ""}
                      className={inputSm}
                      placeholder="e.g. 25 or 15%"
                    />
                  </div>

                  {/* Rule 2 */}
                  <div className="flex items-center gap-2 flex-wrap bg-[#f6f7f7] border border-[#e2e4e7] rounded-[4px] px-3 py-2">
                    <span className="inline-flex items-center justify-center bg-[#2271b1] text-white text-[11px] font-semibold rounded-[3px] px-2 py-0.5 shrink-0">
                      Rule 2
                    </span>
                    <span className="text-[12px] text-[#646970]">If cart total is less than</span>
                    <input
                      type="text"
                      name="markupRule2Threshold"
                      defaultValue={s?.markupRule2Threshold ?? ""}
                      className={inputSm}
                      placeholder="e.g. 2000"
                    />
                    <span className="text-[12px] text-[#646970]">apply markup of</span>
                    <input
                      type="text"
                      name="markupRule2Fee"
                      defaultValue={s?.markupRule2Fee ?? ""}
                      className={inputSm}
                      placeholder="e.g. 10 or 10%"
                    />
                  </div>

                  {/* Rule 3 — fallback */}
                  <div className="flex items-center gap-2 flex-wrap bg-[#f6f7f7] border border-[#e2e4e7] rounded-[4px] px-3 py-2">
                    <span className="inline-flex items-center justify-center bg-[#646970] text-white text-[11px] font-semibold rounded-[3px] px-2 py-0.5 shrink-0">
                      Rule 3
                    </span>
                    <span className="text-[12px] text-[#646970]">For all other orders, apply markup of</span>
                    <input
                      type="text"
                      name="markupRule3Fee"
                      defaultValue={s?.markupRule3Fee ?? ""}
                      className={inputSm}
                      placeholder="e.g. 5 or 5%"
                    />
                  </div>
                </div>
              </td>
            </tr>

            {/* ── Cart Subtotal Discount Rules ──────────────────── */}
            <tr className={trClass}>
              <th scope="row" className={thClass}>
                <label>Cart Subtotal Discounts</label>
                <span className="text-[11px] text-[#646970] font-normal block mt-1">
                  Applied after markup. Highest matching threshold wins.
                </span>
              </th>
              <td className={tdClass}>
                <div className="space-y-3">

                  {/* Discount Rule 1 */}
                  <div className="flex items-center gap-2 flex-wrap bg-[#f6f7f7] border border-[#e2e4e7] rounded-[4px] px-3 py-2">
                    <span className="inline-flex items-center justify-center bg-[#00a32a] text-white text-[11px] font-semibold rounded-[3px] px-2 py-0.5 shrink-0">
                      Rule 1
                    </span>
                    <span className="text-[12px] text-[#646970]">If cart total is at least</span>
                    <input
                      type="text"
                      name="discountRule1Threshold"
                      defaultValue={s?.discountRule1Threshold ?? ""}
                      className={inputSm}
                      placeholder="e.g. 1400"
                    />
                    <span className="text-[12px] text-[#646970]">apply discount of</span>
                    <input
                      type="text"
                      name="discountRule1Amount"
                      defaultValue={s?.discountRule1Amount ?? ""}
                      className={inputSm}
                      placeholder="e.g. 10 or 20%"
                    />
                  </div>

                  {/* Discount Rule 2 */}
                  <div className="flex items-center gap-2 flex-wrap bg-[#f6f7f7] border border-[#e2e4e7] rounded-[4px] px-3 py-2">
                    <span className="inline-flex items-center justify-center bg-[#00a32a] text-white text-[11px] font-semibold rounded-[3px] px-2 py-0.5 shrink-0">
                      Rule 2
                    </span>
                    <span className="text-[12px] text-[#646970]">If cart total is at least</span>
                    <input
                      type="text"
                      name="discountRule2Threshold"
                      defaultValue={s?.discountRule2Threshold ?? ""}
                      className={inputSm}
                      placeholder="e.g. 2000"
                    />
                    <span className="text-[12px] text-[#646970]">apply discount of</span>
                    <input
                      type="text"
                      name="discountRule2Amount"
                      defaultValue={s?.discountRule2Amount ?? ""}
                      className={inputSm}
                      placeholder="e.g. 15 or 25%"
                    />
                  </div>
                </div>
              </td>
            </tr>

            {/* ── Auto Tailgate Threshold ───────────────────────── */}
            <tr className={trClass}>
              <th scope="row" className={thClass}>
                <label htmlFor="autoTailgateKg">Auto Tailgate (kg)</label>
                <span className="text-[11px] text-[#646970] font-normal block mt-1">
                  If any item exceeds this weight, tailgate flags are automatically sent to the API.
                </span>
              </th>
              <td className={tdClass}>
                <div className="flex items-center gap-2">
                  <input
                    id="autoTailgateKg"
                    type="number"
                    name="autoTailgateKg"
                    defaultValue={s?.autoTailgateKg ?? 25}
                    min={1}
                    step={0.1}
                    className={inputSm}
                  />
                  <span className="text-[12px] text-[#646970]">kg</span>
                </div>
                <span className="text-[11px] text-[#646970] mt-1 block">
                  Default: 25 kg (Transdirect standard).
                </span>
              </td>
            </tr>

            {/* ── Debug Mode ────────────────────────────────────── */}
            <tr className={trClass}>
              <th scope="row" className={thClass}>
                <label className="cursor-pointer">Debug Mode</label>
              </th>
              <td className={tdClass}>
                <label className="flex items-start gap-2 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    name="debugMode"
                    defaultChecked={s?.debugMode ?? false}
                    className="border-[#8c8f94] rounded-[3px] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 mt-[1px]"
                  />
                  <div>
                    <span className="text-[13px] text-[#3c434a] font-semibold block">
                      Enable Debug Logging
                    </span>
                    <span className="text-[12px] text-[#646970] mt-1 block">
                      Logs TransDirect API request &amp; response to the server console.
                    </span>
                  </div>
                </label>
              </td>
            </tr>

          </tbody>
        </table>

        <p className="mt-[20px] mb-[30px]">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#2271b1] text-white border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-60 flex items-center gap-2 min-h-[30px] w-fit"
          >
            {loading && <Loader2 className="animate-spin" size={14} />}
            Save Pricing Rules
          </button>
        </p>
      </form>
    </div>
  );
}
