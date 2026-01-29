// File: app/(admin)/admin/settings/affiliate/_components/Configuration/fraud-rule-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { AffiliateFraudRule } from "@prisma/client";
import { Plus, Trash2, Shield, AlertTriangle, Ban, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ✅ CORRECTED IMPORT
import { createFraudRuleAction, deleteFraudRuleAction } from "@/app/actions/admin/settings/affiliates/_services/fraud-rule-service";

interface Props {
  initialRules: AffiliateFraudRule[];
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

  const handleDelete = (id: string) => {
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
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-100 rounded-xl p-5 text-sm text-red-800 flex items-start gap-4 shadow-sm animate-in fade-in">
        <div className="p-2 bg-red-100 rounded-lg shrink-0">
            <Shield className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <p className="font-bold text-base">Active Fraud Shield</p>
          <p className="mt-1 opacity-90 leading-relaxed">Rules defined here run in real-time. If a condition matches, the affiliate is automatically flagged or blocked to prevent payout loss.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-fit sticky top-4">
          <h4 className="text-sm font-bold text-gray-900 mb-5 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4"/> Add Security Rule
          </h4>
          <form onSubmit={handleCreate} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Trigger Condition</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all"
              >
                <option value="IP_CLICK_LIMIT">High Click Volume (IP)</option>
                <option value="CONVERSION_RATE_LIMIT">Suspicious Conversion Rate</option>
                <option value="ORDER_VALUE_LIMIT">Abnormal Order Value</option>
                <option value="BLACKLIST_COUNTRY">Blacklisted Country</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Threshold Value</label>
              <input 
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 50 (clicks) or BD (country)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Automated Action</label>
              <div className="grid grid-cols-3 gap-2">
                {['FLAG', 'BLOCK', 'SUSPEND'].map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setAction(act)}
                    className={`px-2 py-2 text-xs font-bold rounded-md border transition-all ${
                      action === act 
                        ? 'bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-200' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 pt-1">
                {action === "FLAG" ? "Marks for review. Payouts paused." : action === "BLOCK" ? "Blocks IP immediately." : "Suspends affiliate account."}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Log Reason</label>
              <input 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Bot traffic detected"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all"
              />
            </div>

            <button 
              type="submit" 
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg active:scale-95"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : "Activate Rule"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2">
             <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Configured Rules ({initialRules.length})</h4>
          </div>
          
          {initialRules.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 bg-gray-50/50 flex flex-col items-center">
              <Info className="w-10 h-10 mb-2 opacity-20"/>
              <p>No custom rules defined yet.</p>
            </div>
          ) : (
            initialRules.map((rule) => (
              <div key={rule.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all gap-4 group">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg flex-shrink-0 ${
                    rule.action === 'BLOCK' || rule.action === 'SUSPEND' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {rule.action === 'BLOCK' ? <Ban className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm">
                      {getRuleDescription(rule.type, rule.value)}
                    </h5>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            rule.action === 'FLAG' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                            {rule.action}
                        </span>
                        <span className="text-xs text-gray-500">• {rule.reason}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(rule.id)}
                  disabled={isPending}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors self-end sm:self-center opacity-0 group-hover:opacity-100"
                  title="Remove Rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}