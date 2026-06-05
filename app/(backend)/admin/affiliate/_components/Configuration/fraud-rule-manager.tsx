// File: app/(backend)/admin/affiliate/_components/Configuration/fraud-rule-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Shield, AlertTriangle, Ban, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createFraudRuleAction, deleteFraudRuleAction } from "@/app/actions/backend/affiliate/_services/fraud-service";

// ✅ FIXED: Using JSON Object structure instead of deleted Prisma Model
interface FraudRuleItem {
  id?: string;
  type: string;
  value: string;
  action: string;
  reason?: string;
}

interface Props {
  initialRules: FraudRuleItem[];
}

export default function FraudRuleManager({ initialRules }: Props) {
  const [isPending, startTransition] = useTransition();
  
  const [type, setType] = useState("IP_CLICK_LIMIT");
  const [value, setValue] = useState("");
  const [action, setAction] = useState("FLAG");
  const [reason, setReason] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return toast.error("Value is required");

    startTransition(async () => {
      const res = await createFraudRuleAction({ 
        type: type as any, 
        value, 
        action: action as any, 
        reason: reason || "Automated Rule Match"
      });
      
      if (res.success) {
        toast.success(res.message);
        setValue("");
        setReason("");
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleDelete = (id?: string) => {
    if (!id) return;
    if (!confirm("Delete this security rule?")) return;
    startTransition(async () => {
      const res = await deleteFraudRuleAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const getRuleDescription = (ruleType: string, val: string) => {
    switch(ruleType) {
      case "IP_CLICK_LIMIT": return `More than ${val} clicks from same IP within 24h`;
      case "CONVERSION_RATE_LIMIT": return `Conversion rate exceeds ${val}% (unrealistic)`;
      case "ORDER_VALUE_LIMIT": return `Order value exceeds $${val} (High Ticket)`;
      case "BLACKLIST_COUNTRY": return `Traffic originates from country: ${val}`;
      default: return `Threshold match: ${val}`;
    }
  };

  return (
    <div className="space-y-4 font-sans text-[#1d2327]">
      
      {/* WP Admin Notice Style */}
      <div className="bg-white border-l-4 border-[#d63638] shadow-sm p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-[#d63638] shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-[#1d2327] m-0 text-[14px]">Active Fraud Shield</p>
          <p className="mt-1 text-[13px] text-[#50575e] m-0">Rules defined here run in real-time. If a condition matches, the affiliate is automatically flagged or blocked to prevent payout loss.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WP Metabox Style - Add Form */}
        <div className="bg-white border border-[#c3c4c7] shadow-sm h-fit sticky top-4">
          <div className="border-b border-[#c3c4c7] px-4 py-3 bg-[#f0f0f1]">
            <h4 className="text-[14px] font-semibold text-[#1d2327] m-0 flex items-center gap-2">
                <Plus className="w-4 h-4"/> Add Security Rule
            </h4>
          </div>
          
          <div className="p-4">
            <form onSubmit={handleCreate} className="space-y-4">
              
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Trigger Condition</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px] bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
                >
                  <option value="IP_CLICK_LIMIT">High Click Volume (IP)</option>
                  <option value="CONVERSION_RATE_LIMIT">Suspicious Conversion Rate</option>
                  <option value="ORDER_VALUE_LIMIT">Abnormal Order Value</option>
                  <option value="BLACKLIST_COUNTRY">Blacklisted Country</option>
                </select>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Threshold Value</label>
                <input 
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g. 50 (clicks) or BD"
                  className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Automated Action</label>
                <div className="flex gap-2">
                  {['FLAG', 'BLOCK', 'SUSPEND'].map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setAction(act)}
                      className={`flex-1 py-1.5 text-[12px] font-semibold rounded-sm border transition-colors ${
                        action === act 
                          ? 'bg-[#d63638] text-white border-[#d63638]' 
                          : 'bg-[#f0f0f1] text-[#2c3338] border-[#8c8f94] hover:bg-[#e6e6e6]'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#50575e] mt-1.5 italic m-0">
                  {action === "FLAG" ? "Marks for review. Payouts paused." : action === "BLOCK" ? "Blocks IP immediately." : "Suspends affiliate account."}
                </p>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Log Reason</label>
                <input 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Bot traffic detected"
                  className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 border border-[#2271b1] bg-[#2271b1] text-white py-1.5 rounded-sm text-[13px] font-semibold hover:bg-[#135e96] disabled:opacity-50 transition-colors"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : "Activate Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* WP List Table Style - Configured Rules */}
        <div className="lg:col-span-2 space-y-3">
          <h4 className="text-[14px] font-semibold text-[#1d2327] m-0">Configured Rules ({initialRules.length})</h4>
          
          {initialRules.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-[#c3c4c7] bg-[#f0f0f1] flex flex-col items-center">
              <Info className="w-8 h-8 mb-2 text-[#8c8f94]"/>
              <p className="text-[13px] text-[#50575e] m-0">No custom rules defined yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#c3c4c7] shadow-sm divide-y divide-[#f0f0f1]">
                {initialRules.map((rule, idx) => (
                <div key={rule.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-[#f6f7f7] transition-colors group">
                    <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${
                        rule.action === 'BLOCK' || rule.action === 'SUSPEND' ? 'text-[#d63638]' : 'text-[#f0b849]'
                    }`}>
                        {rule.action === 'BLOCK' ? <Ban className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                        <h5 className="font-semibold text-[#1d2327] text-[13px] m-0">
                        {getRuleDescription(rule.type, rule.value)}
                        </h5>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase border ${
                                rule.action === 'FLAG' ? 'bg-[#fcf9e8] text-[#8a6d3b] border-[#f0b849]' : 'bg-[#fcf0f1] text-[#d63638] border-[#d63638]/30'
                            }`}>
                                {rule.action}
                            </span>
                            <span className="text-[12px] text-[#50575e] italic">Reason: {rule.reason}</span>
                        </div>
                    </div>
                    </div>
                    <button 
                        onClick={() => handleDelete(rule.id)}
                        disabled={isPending}
                        className="text-[#d63638] hover:underline text-[12px] mt-2 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Rule"
                    >
                        Trash
                    </button>
                </div>
                ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}