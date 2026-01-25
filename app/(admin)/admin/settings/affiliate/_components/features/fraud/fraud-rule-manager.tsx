//app/(admin)/admin/settings/affiliate/_components/features/fraud/fraud-rule-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { AffiliateFraudRule } from "@prisma/client";
import { Plus, Trash2, Shield, AlertTriangle, Ban } from "lucide-react";
import { toast } from "sonner";
import { createFraudRuleAction, deleteFraudRuleAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-fraud-rules";

interface Props {
  initialRules: AffiliateFraudRule[];
}

export default function FraudRuleManager({ initialRules }: Props) {
  const [isPending, startTransition] = useTransition();
  
  // Form State
  const [type, setType] = useState("IP_CLICK_LIMIT");
  const [value, setValue] = useState("");
  const [action, setAction] = useState("FLAG");
  const [reason, setReason] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createFraudRuleAction({ 
        type: type as any, 
        value, 
        action: action as any, 
        reason 
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
    startTransition(async () => {
      const res = await deleteFraudRuleAction(id);
      if (res.success) toast.success(res.message);
    });
  };

  const getRuleDescription = (ruleType: string, val: string) => {
    switch(ruleType) {
      case "IP_CLICK_LIMIT": return `More than ${val} clicks from same IP`;
      case "CONVERSION_RATE_LIMIT": return `Conversion rate exceeds ${val}%`;
      case "BLACKLIST_COUNTRY": return `Traffic from country code: ${val}`;
      default: return `Threshold: ${val}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 text-sm text-orange-800 flex items-start gap-3">
        <Shield className="w-5 h-5 shrink-0" />
        <div>
          <p className="font-semibold">Automated Security Rules</p>
          <p className="mt-1">Define triggers that will automatically flag or block affiliates. These rules run in real-time on every click and order.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create Rule Form */}
        <div className="bg-white border rounded-lg p-5 shadow-sm h-fit">
          <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Add New Rule</h4>
          <form onSubmit={handleCreate} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Trigger Condition</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="IP_CLICK_LIMIT">High Click Volume (IP)</option>
                <option value="CONVERSION_RATE_LIMIT">Suspicious Conversion Rate</option>
                <option value="BLACKLIST_COUNTRY">Blacklisted Country</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Threshold Value</label>
              <input 
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 50 (clicks) or BD (country)"
                required
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Action to Take</label>
              <div className="grid grid-cols-3 gap-2">
                {['FLAG', 'BLOCK', 'SUSPEND'].map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setAction(act)}
                    className={`px-2 py-2 text-xs font-medium rounded border transition-colors ${
                      action === act 
                        ? 'bg-black text-white border-black' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Log Reason (Optional)</label>
              <input 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Bot traffic detected"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <button 
              type="submit" 
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 mt-2"
            >
              <Plus className="w-4 h-4" /> Add Rule
            </button>
          </form>
        </div>

        {/* Rules List */}
        <div className="lg:col-span-2 space-y-3">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Active Rules</h4>
          
          {initialRules.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed rounded-lg text-gray-400">
              No custom rules defined yet.
            </div>
          ) : (
            initialRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    rule.action === 'BLOCK' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {rule.action === 'BLOCK' ? <Ban className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 text-sm">
                      {getRuleDescription(rule.type, rule.value)}
                    </h5>
                    <p className="text-xs text-gray-500">
                      Action: <span className="font-bold">{rule.action}</span> • {rule.reason}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(rule.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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