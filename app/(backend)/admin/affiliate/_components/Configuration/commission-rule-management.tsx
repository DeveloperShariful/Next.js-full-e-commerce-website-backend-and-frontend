// File: app/(backend)/admin/affiliate/_components/Configuration/commissiton-rule-manager.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { AffiliateCommissionRule } from "@prisma/client";
import { Edit, Trash2, GripVertical, Plus, Calculator, CalendarClock, Ban, CheckCircle, X, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { deleteRuleAction, upsertRuleAction } from "@/app/actions/backend/affiliate/_services/commition-rule-service";

// ============================================================================
// PART 1: MAIN COMPONENT (WP LIST VIEW)
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

  // Helper to visualize JSON Logic (WP Style Chips)
  const renderConditions = (conditions: any) => {
    if (!conditions || typeof conditions !== 'object') return <span className="text-[#8c8f94] italic">Always applies</span>;
    
    const chips = [];
    if (conditions.minOrderAmount) chips.push(`Order > ${symbol}${conditions.minOrderAmount}`);
    if (conditions.customerType) chips.push(conditions.customerType === 'NEW' ? 'New Customers' : 'Returning');
    if (conditions.categoryIds?.length) chips.push(`Specific Categories`);
    
    return (
        <div className="flex flex-wrap gap-1">
            {chips.map((c, i) => (
                <span key={i} className="text-[11px] bg-[#f0f0f1] border border-[#c3c4c7] text-[#50575e] px-1.5 py-0.5 rounded-sm">
                    {c}
                </span>
            ))}
            {chips.length === 0 && <span className="text-[11px] text-[#8c8f94] italic">No specific conditions</span>}
        </div>
    );
  };

  const getActionLabel = (action: any) => {
      const val = action?.value || 0;
      const type = action?.type === "FIXED" ? symbol : "%";
      return action?.type === "FIXED" ? `${type}${val}` : `${val}${type}`;
  };

  return (
    <div className="font-sans text-[#1d2327]">
      <div className="bg-white border border-[#c3c4c7] shadow-sm">
        {/* WP Action Header */}
        <div className="px-4 py-3 border-b border-[#c3c4c7] bg-white flex justify-between items-center">
          <div>
             <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Dynamic Commission Rules</h3>
             <p className="text-[12px] text-[#50575e] m-0 mt-0.5">Higher priority rules execute first.</p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center border border-[#2271b1] bg-[#2271b1] text-white px-3 py-1.5 text-[13px] rounded-sm hover:bg-[#135e96] hover:border-[#135e96] transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add New Rule
          </button>
        </div>

        {/* WP List Table Body */}
        <div className="divide-y divide-[#f0f0f1]">
          {initialRules.length === 0 ? (
            <div className="p-8 text-center text-[#50575e] flex flex-col items-center bg-[#f6f7f7]">
              <Calculator className="h-8 w-8 text-[#c3c4c7] mb-2" />
              <p className="text-[13px] m-0 font-medium">No custom rules defined.</p>
              <p className="text-[12px] text-[#8c8f94] m-0 mt-1">The system will use Tier defaults.</p>
            </div>
          ) : (
            initialRules.map((rule) => (
              <div 
                key={rule.id} 
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-[#f6f7f7] transition-colors gap-4"
              >
                {/* Left: Info */}
                <div className="flex items-start gap-3">
                  <div className="mt-1 cursor-grab active:cursor-grabbing text-[#c3c4c7] hover:text-[#50575e] p-1">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1d2327] text-[13px]">{rule.name}</span>
                      {rule.isActive ? (
                        <CheckCircle className="w-3.5 h-3.5 text-[#00a32a]" />
                      ) : (
                        <Ban className="w-3.5 h-3.5 text-[#d63638]" />
                      )}
                      <span className="text-[11px] text-[#50575e] bg-[#f0f0f1] px-1.5 py-0.5 rounded-sm border border-[#c3c4c7]">
                        Priority: {rule.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[12px]">
                      <span className="font-mono font-bold bg-[#f0f6fc] text-[#2271b1] px-1.5 py-0.5 rounded-sm border border-[#2271b1]/30">
                        Reward: {getActionLabel(rule.action)}
                      </span>
                      <div className="h-3 w-px bg-[#c3c4c7]"></div>
                      {renderConditions(rule.conditions)}
                    </div>
                    
                    {rule.endDate && (
                        <div className="flex items-center gap-1 text-[11px] text-[#d63638] bg-[#fcf0f1] border border-[#d63638]/20 px-1.5 py-0.5 rounded-sm w-fit mt-1">
                            <CalendarClock className="w-3 h-3"/>
                            Ends: {format(new Date(rule.endDate), "Y/m/d")}
                        </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-center">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="text-[#2271b1] hover:underline text-[13px] px-2 py-1"
                  >
                    Edit
                  </button>
                  <span className="text-[#c3c4c7]">|</span>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    disabled={isDeleting}
                    className="text-[#d63638] hover:underline text-[13px] px-2 py-1 disabled:opacity-50"
                  >
                    Trash
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
    </div>
  );
}

// ============================================================================
// PART 2: MODAL COMPONENT (WP METABOX STYLE)
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
        requiredCategoryIds: Array.isArray(conditions?.categoryIds) ? conditions.categoryIds.join(", ") : "",
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
      // String to Array conversion
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-sans text-[#1d2327]">
      <div className="bg-[#f0f0f1] border border-[#c3c4c7] shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* WP Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#c3c4c7] bg-white">
          <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">
            {initialData ? "Edit Logic Rule" : "Create Logic Rule"}
          </h3>
          <button onClick={onClose} className="text-[#50575e] hover:text-[#d63638] transition-colors focus:outline-none">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WP Scrollable Form Body */}
        <div className="overflow-y-auto p-5 bg-white">
          <form id="rule-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            {/* 1. Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Rule Name</label>
                <input
                  {...form.register("name", { required: "Name is required" })}
                  placeholder="e.g. Black Friday Boost"
                  className="w-full border border-[#8c8f94] px-2 py-1.5 text-[13px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none rounded-sm bg-white"
                />
                {form.formState.errors.name && <p className="text-[#d63638] text-[11px] mt-1">{form.formState.errors.name.message}</p>}
              </div>
              
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Priority</label>
                <input
                  type="number"
                  {...form.register("priority")}
                  className="w-full border border-[#8c8f94] px-2 py-1.5 text-[13px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none rounded-sm bg-white"
                />
                <p className="text-[11px] text-[#50575e] mt-1 m-0 italic">Higher number runs first.</p>
              </div>
            </div>

            {/* 2. Logic Builder (Conditions) WP Metabox */}
            <div className="border border-[#c3c4c7] p-4 bg-[#f6f7f7]">
              <h4 className="text-[13px] font-semibold text-[#1d2327] m-0 mb-3 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#50575e]" />
                Trigger Conditions (IF)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-[#50575e] block mb-1">Customer Type</label>
                  <select
                    {...form.register("customerType")}
                    className="w-full border border-[#8c8f94] px-2 py-1.5 text-[13px] focus:border-[#2271b1] outline-none rounded-sm bg-white"
                  >
                    <option value="ALL">Any Customer</option>
                    <option value="NEW">New Customer Only</option>
                    <option value="RETURNING">Returning Customer</option>
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-[#50575e] block mb-1">Min. Order Value ({currency})</label>
                  <input
                    type="number"
                    placeholder="0"
                    {...form.register("minOrderAmount")}
                    className="w-full border border-[#8c8f94] px-2 py-1.5 text-[13px] focus:border-[#2271b1] outline-none rounded-sm bg-white"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="text-[12px] font-semibold text-[#50575e] block mb-1">Specific Categories (IDs)</label>
                  <input
                    type="text"
                    placeholder="e.g. cat_123, cat_456 (Leave empty for all)"
                    {...form.register("requiredCategoryIds")}
                    className="w-full border border-[#8c8f94] px-2 py-1.5 text-[13px] focus:border-[#2271b1] outline-none rounded-sm bg-white"
                  />
                  <p className="text-[11px] text-[#8c8f94] mt-1 m-0">Comma separated category IDs.</p>
                </div>
              </div>
            </div>

            {/* 3. Action (Reward) WP Metabox */}
            <div className="border border-[#2271b1]/30 p-4 bg-[#f0f6fc]">
              <h4 className="text-[13px] font-semibold text-[#2271b1] m-0 mb-3">Reward (THEN)</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-[#50575e] block mb-1">Commission Type</label>
                  <select
                    {...form.register("actionType")}
                    className="w-full border border-[#8c8f94] px-2 py-1.5 text-[13px] focus:border-[#2271b1] outline-none rounded-sm bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ({currency})</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#50575e] block mb-1">Value</label>
                  <input
                    type="number"
                    step="0.01"
                    {...form.register("actionValue", { min: 0, required: true })}
                    className="w-full border border-[#8c8f94] px-2 py-1.5 text-[13px] focus:border-[#2271b1] outline-none rounded-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 4. Schedule & Status */}
            <div className="grid grid-cols-2 gap-4 border-t border-[#f0f0f1] pt-4">
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Start Date</label>
                <input
                  type="date"
                  {...form.register("startDate")}
                  className="w-full border border-[#8c8f94] px-2 py-1.5 text-[13px] focus:border-[#2271b1] outline-none rounded-sm bg-white"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">End Date</label>
                <input
                  type="date"
                  {...form.register("endDate")}
                  className="w-full border border-[#8c8f94] px-2 py-1.5 text-[13px] focus:border-[#2271b1] outline-none rounded-sm bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="isActive"
                className="w-4 h-4 rounded-sm border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]" 
                {...form.register("isActive")} 
              />
              <label htmlFor="isActive" className="text-[13px] font-semibold text-[#1d2327] cursor-pointer">
                Rule is Active
              </label>
            </div>

          </form>
        </div>

        {/* WP Footer Actions */}
        <div className="p-3 border-t border-[#c3c4c7] bg-[#f0f0f1] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-[#8c8f94] bg-[#f0f0f1] text-[#2c3338] text-[13px] rounded-sm hover:bg-[#e6e6e6] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="rule-form"
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 border border-[#2271b1] bg-[#2271b1] text-white text-[13px] rounded-sm hover:bg-[#135e96] disabled:opacity-50 transition-colors shadow-sm"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {initialData ? "Update Rule" : "Create Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}