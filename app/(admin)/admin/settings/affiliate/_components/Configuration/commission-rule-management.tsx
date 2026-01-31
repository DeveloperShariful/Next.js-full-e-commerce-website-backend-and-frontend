// File: app/(admin)/admin/settings/affiliate/_components/Configuration/commissiton-rule-manager.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { AffiliateCommissionRule } from "@prisma/client";
import { Edit, Trash2, GripVertical, Plus, Calculator, CalendarClock, Ban, CheckCircle, X, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { deleteRuleAction, upsertRuleAction } from "@/app/actions/admin/settings/affiliate/_services/commition-rule-service";

// ============================================================================
// PART 1: MAIN COMPONENT (LIST VIEW)
// ============================================================================

interface RuleManagementProps {
  initialRules: AffiliateCommissionRule[];
}

export default function CommissionRuleManagement({ initialRules }: RuleManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AffiliateCommissionRule | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const { symbol } = useGlobalStore(); 

  const handleCreate = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleEdit = (rule: AffiliateCommissionRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure? This will delete the logic rule permanently.")) return;
    
    startDelete(async () => {
      const result = await deleteRuleAction(id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  };

  // Helper to visualize JSON Logic
  const renderConditions = (conditions: any) => {
    if (!conditions || typeof conditions !== 'object') return <span className="text-gray-400">Always applies</span>;
    
    const chips = [];
    if (conditions.minOrderAmount) chips.push(`Order > ${symbol}${conditions.minOrderAmount}`);
    if (conditions.customerType) chips.push(conditions.customerType === 'NEW' ? 'New Customers' : 'Returning');
    if (conditions.categoryIds?.length) chips.push(`Specific Categories`);
    
    return (
        <div className="flex flex-wrap gap-1">
            {chips.map((c, i) => (
                <span key={i} className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                    {c}
                </span>
            ))}
            {chips.length === 0 && <span className="text-[10px] text-gray-400 italic">No specific conditions</span>}
        </div>
    );
  };

  const getActionLabel = (action: any) => {
      const val = action?.value || 0;
      const type = action?.type === "FIXED" ? symbol : "%";
      return action?.type === "FIXED" ? `${type}${val}` : `${val}${type}`;
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Actions Header */}
        <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
          <div>
             <h3 className="font-semibold text-gray-900">Dynamic Commission Rules</h3>
             <p className="text-xs text-gray-500">Higher priority rules execute first.</p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-all shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Rule
          </button>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-100">
          {initialRules.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <Calculator className="h-10 w-10 text-gray-300 mb-3" />
              <p>No custom rules defined.</p>
              <p className="text-xs text-gray-400">The system will use Tier defaults.</p>
            </div>
          ) : (
            initialRules.map((rule) => (
              <div 
                key={rule.id} 
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50/80 transition-all gap-4"
              >
                {/* Left: Info */}
                <div className="flex items-start gap-3">
                  <div className="mt-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{rule.name}</span>
                      {rule.isActive ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Ban className="w-3.5 h-3.5 text-gray-300" />
                      )}
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border">
                        Priority: {rule.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                        Reward: {getActionLabel(rule.action)}
                      </span>
                      <div className="h-4 w-px bg-gray-200"></div>
                      {renderConditions(rule.conditions)}
                    </div>
                    
                    {rule.endDate && (
                        <div className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded w-fit">
                            <CalendarClock className="w-3 h-3"/>
                            Ends: {format(new Date(rule.endDate), "dd MMM yyyy")}
                        </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-center">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    disabled={isDeleting}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <RuleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingRule}
        />
      )}
    </>
  );
}

// ============================================================================
// PART 2: MODAL COMPONENT (MERGED)
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: AffiliateCommissionRule | null;
}

interface RuleFormValues {
  id?: string;
  name: string;
  isActive: boolean;
  priority: number;
  
  // Action
  actionType: "PERCENTAGE" | "FIXED";
  actionValue: number;
  
  // Dates
  startDate?: string;
  endDate?: string;

  // Logic Conditions
  minOrderAmount?: number;
  customerType?: "ALL" | "NEW" | "RETURNING";
  requiredCategoryIds?: string; 
}

function RuleModal({ isOpen, onClose, initialData }: ModalProps) {
  const [isPending, startTransition] = useTransition();
  const { symbol } = useGlobalStore(); 
  const currency = symbol || " ";
  
  const form = useForm<RuleFormValues>({
    defaultValues: {
      name: "",
      isActive: true,
      priority: 0,
      actionType: "PERCENTAGE",
      actionValue: 0,
      customerType: "ALL",
    },
  });

  useEffect(() => {
    if (initialData) {
      const action = initialData.action as any;
      const conditions = initialData.conditions as any;
      
      form.reset({
        id: initialData.id,
        name: initialData.name,
        isActive: initialData.isActive,
        priority: initialData.priority,
        actionType: action?.type || "PERCENTAGE",
        actionValue: action?.value || 0,
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : undefined,
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : undefined,
        
        minOrderAmount: conditions?.minOrderAmount || undefined,
        customerType: conditions?.customerType || "ALL",
        requiredCategoryIds: conditions?.categoryIds?.join(",") || "",
      });
    } else {
      form.reset({
        name: "",
        isActive: true,
        priority: 0,
        actionType: "PERCENTAGE",
        actionValue: 0,
        customerType: "ALL",
      });
    }
  }, [initialData, form, isOpen]);

  const onSubmit = (data: RuleFormValues) => {
    // 1. Construct the JSON Logic Object
    const conditions: Record<string, any> = {};
    
    if (data.minOrderAmount && data.minOrderAmount > 0) {
      conditions.minOrderAmount = data.minOrderAmount;
    }
    if (data.customerType && data.customerType !== "ALL") {
      conditions.customerType = data.customerType;
    }
    if (data.requiredCategoryIds) {
      conditions.categoryIds = data.requiredCategoryIds.split(",").map(s => s.trim()).filter(Boolean);
    }
    
    if (Object.keys(conditions).length === 0) {
      conditions.alwaysTrue = true;
    }

    // 2. Prepare Payload
    const payload: any = {
      id: data.id,
      name: data.name,
      isActive: data.isActive,
      priority: data.priority,
      conditions: conditions, 
      action: {
        type: data.actionType,
        value: data.actionValue,
      },
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      affiliateSpecificIds: [],
    };

    startTransition(async () => {
      const result = await upsertRuleAction(payload);
      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {initialData ? "Edit Logic Rule" : "Create Logic Rule"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6">
          <form id="rule-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* 1. Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-sm font-medium text-gray-700">Rule Name</label>
                <input
                  {...form.register("name", { required: "Name is required" })}
                  placeholder="e.g. Black Friday Boost"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                />
                {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Priority</label>
                <input
                  type="number"
                  {...form.register("priority")}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                />
                <p className="text-[10px] text-gray-500">Higher number runs first.</p>
              </div>
            </div>

            {/* 2. Logic Builder (Conditions) */}
            <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Trigger Conditions (IF)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Customer Type</label>
                  <select
                    {...form.register("customerType")}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="ALL">Any Customer</option>
                    <option value="NEW">New Customer Only</option>
                    <option value="RETURNING">Returning Customer</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Min. Order Value ({currency})</label>
                  <input
                    type="number"
                    placeholder="0"
                    {...form.register("minOrderAmount")}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Specific Categories (IDs)</label>
                  <input
                    type="text"
                    placeholder="e.g. cat_123, cat_456 (Leave empty for all)"
                    {...form.register("requiredCategoryIds")}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                  <p className="text-[10px] text-gray-500">Comma separated category IDs.</p>
                </div>
              </div>
            </div>

            {/* 3. Action (Reward) */}
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-100 space-y-4">
              <h4 className="text-sm font-semibold text-blue-900">Reward (THEN)</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Commission Type</label>
                  <select
                    {...form.register("actionType")}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ({currency})</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Value</label>
                  <input
                    type="number"
                    step="0.01"
                    {...form.register("actionValue", { min: 0, required: true })}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 4. Schedule & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  {...form.register("startDate")}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  {...form.register("endDate")}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="isActive"
                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" 
                {...form.register("isActive")} 
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-900 cursor-pointer">
                Rule is Active
              </label>
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="rule-form"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {initialData ? "Update Rule" : "Create Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}