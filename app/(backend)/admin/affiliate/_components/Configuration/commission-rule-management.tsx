// File: app/(backend)/admin/affiliate/_components/Configuration/commission-rule-management.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { AffiliateCommissionRule } from "@prisma/client";
import {
  Edit, Trash2, Plus, Calculator, CalendarClock,
  Ban, CheckCircle, X, Loader2, Save, Percent
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { deleteRuleAction, upsertRuleAction } from "@/app/actions/backend/affiliate/_services/commition-rule-service";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RuleAction {
  type: "PERCENTAGE" | "FIXED";
  value: number;
}

interface RuleConditions {
  minOrderAmount?: number;
  customerType?: "NEW" | "RETURNING";
  categoryIds?: string[];
  alwaysTrue?: boolean;
}

interface RulePayload {
  id?: string;
  name: string;
  isActive: boolean;
  priority: number;
  conditions: RuleConditions;
  action: RuleAction;
  startDate: string | null;
  endDate: string | null;
  affiliateSpecificIds: string[];
}

interface RuleManagementProps {
  initialRules: AffiliateCommissionRule[];
}

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
  actionType: "PERCENTAGE" | "FIXED";
  actionValue: number;
  startDate?: string;
  endDate?: string;
  minOrderAmount?: number;
  customerType: "ALL" | "NEW" | "RETURNING";
  requiredCategoryIds?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAction(raw: unknown): RuleAction {
  if (raw && typeof raw === "object" && "type" in raw && "value" in raw) {
    return raw as RuleAction;
  }
  return { type: "PERCENTAGE", value: 0 };
}

function parseConditions(raw: unknown): RuleConditions {
  if (raw && typeof raw === "object") return raw as RuleConditions;
  return {};
}

function ActionBadge({ action, symbol }: { action: RuleAction; symbol: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[12px] font-bold bg-[#edfaef] text-[#00a32a] border border-[#00a32a]/30 px-1.5 py-0.5 rounded">
      {action.type === "PERCENTAGE" ? (
        <>{action.value}<Percent className="w-2.5 h-2.5" /></>
      ) : (
        <>{symbol}{action.value}</>
      )}
    </span>
  );
}

function ConditionChips({ conditions }: { conditions: RuleConditions }) {
  const chips: string[] = [];
  if (conditions.minOrderAmount) chips.push(`Order > ${conditions.minOrderAmount}`);
  if (conditions.customerType === "NEW")       chips.push("New Customers");
  if (conditions.customerType === "RETURNING") chips.push("Returning");
  if (conditions.categoryIds?.length)          chips.push("Specific Categories");

  if (chips.length === 0)
    return <span className="text-[11px] text-[#8c8f94] italic">Always applies</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((c) => (
        <span key={c} className="text-[11px] bg-[#f0f0f1] border border-[#c3c4c7] text-[#50575e] px-1.5 py-0.5 rounded">
          {c}
        </span>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CommissionRuleManagement({ initialRules }: RuleManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AffiliateCommissionRule | null>(null);
  const [isDeleting, startDelete]     = useTransition();
  const { symbol } = useGlobalStore();

  const handleCreate = () => { setEditingRule(null); setIsModalOpen(true); };
  const handleEdit   = (rule: AffiliateCommissionRule) => { setEditingRule(rule); setIsModalOpen(true); };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this rule permanently?")) return;
    startDelete(async () => {
      const res = await deleteRuleAction(id);
      if (res.success) { toast.success(res.message); window.location.reload(); }
      else toast.error(res.message);
    });
  };

  return (
    <div
      className="w-full space-y-4 animate-in fade-in duration-500 pb-20"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      {/* WP Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#c3c4c7]">
        <span className="text-[13px] text-[#50575e]">
          Higher priority rules execute first.{" "}
          <span className="hidden sm:inline">{initialRules.length} rule{initialRules.length !== 1 ? "s" : ""} defined.</span>
        </span>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 h-8 px-3 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add New Rule
        </button>
      </div>

      {/* WP Widefat Table */}
      {initialRules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-[#c3c4c7]">
          <Calculator className="w-10 h-10 text-[#c3c4c7] mb-3" />
          <p className="text-[13px] font-semibold text-[#1d2327] m-0">No custom rules defined.</p>
          <p className="text-[12px] text-[#8c8f94] mt-1">The system will use tier defaults. Add a rule for dynamic overrides.</p>
          <button
            onClick={handleCreate}
            className="mt-4 flex items-center gap-1.5 h-8 px-3 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create First Rule
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#c3c4c7] overflow-x-auto">
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
                <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#1d2327]">Rule Name</th>
                <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#1d2327]">Reward</th>
                <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#1d2327] hidden md:table-cell">Conditions</th>
                <th className="text-center px-3 py-2.5 text-[12px] font-semibold text-[#1d2327] hidden sm:table-cell">Priority</th>
                <th className="text-center px-3 py-2.5 text-[12px] font-semibold text-[#1d2327] hidden lg:table-cell">Schedule</th>
                <th className="text-center px-3 py-2.5 text-[12px] font-semibold text-[#1d2327]">Status</th>
              </tr>
            </thead>
            <tbody>
              {initialRules.map((rule, idx) => {
                const action     = parseAction(rule.action);
                const conditions = parseConditions(rule.conditions);

                return (
                  <tr
                    key={rule.id}
                    className={cn(
                      "group border-b border-[#f0f0f1] last:border-b-0 hover:bg-[#eaecf0] transition-colors",
                      idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"
                    )}
                  >
                    {/* Name + row actions */}
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="font-semibold text-[13px] text-[#2271b1] hover:underline text-left block"
                      >
                        {rule.name}
                      </button>
                      <div className="flex items-center mt-0.5 text-[12px] sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(rule)} className="text-[#2271b1] hover:underline flex items-center gap-1">
                          <Edit className="w-3 h-3" /> Edit
                        </button>
                        <span className="text-[#c3c4c7] px-1.5">|</span>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          disabled={isDeleting}
                          className="text-[#d63638] hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </td>

                    {/* Reward */}
                    <td className="px-3 py-2.5">
                      <ActionBadge action={action} symbol={symbol || "$"} />
                    </td>

                    {/* Conditions */}
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <ConditionChips conditions={conditions} />
                    </td>

                    {/* Priority */}
                    <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                      <span className="text-[11px] font-semibold bg-[#f0f0f1] border border-[#c3c4c7] text-[#50575e] px-2 py-0.5 rounded">
                        {rule.priority}
                      </span>
                    </td>

                    {/* Schedule */}
                    <td className="px-3 py-2.5 text-center hidden lg:table-cell">
                      {rule.endDate ? (
                        <span className="flex items-center justify-center gap-1 text-[11px] text-[#d63638]">
                          <CalendarClock className="w-3 h-3" />
                          {format(new Date(rule.endDate), "MMM d, yyyy")}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#8c8f94]">No end</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5 text-center">
                      {rule.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#edfaef] text-[#00a32a] border border-[#00a32a]/30 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#fcebec] text-[#d63638] border border-[#d63638]/30 px-2 py-0.5 rounded">
                          <Ban className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-[#f0f0f1] bg-[#f6f7f7] text-[12px] text-[#50575e]">
            {initialRules.length} rule{initialRules.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

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

// ── Modal ─────────────────────────────────────────────────────────────────────

function RuleModal({ isOpen, onClose, initialData }: ModalProps) {
  const [isPending, startTransition] = useTransition();
  const { symbol } = useGlobalStore();
  const currency = symbol || "$";

  const form = useForm<RuleFormValues>({
    defaultValues: {
      name:          "",
      isActive:      true,
      priority:      0,
      actionType:    "PERCENTAGE",
      actionValue:   0,
      customerType:  "ALL",
    },
  });

  useEffect(() => {
    if (initialData) {
      const action     = parseAction(initialData.action);
      const conditions = parseConditions(initialData.conditions);
      form.reset({
        id:                   initialData.id,
        name:                 initialData.name,
        isActive:             initialData.isActive,
        priority:             initialData.priority,
        actionType:           action.type,
        actionValue:          action.value,
        startDate:            initialData.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : undefined,
        endDate:              initialData.endDate   ? new Date(initialData.endDate).toISOString().split("T")[0]   : undefined,
        minOrderAmount:       conditions.minOrderAmount,
        customerType:         (conditions.customerType as RuleFormValues["customerType"]) || "ALL",
        requiredCategoryIds:  Array.isArray(conditions.categoryIds) ? conditions.categoryIds.join(", ") : "",
      });
    } else {
      form.reset({
        name: "", isActive: true, priority: 0,
        actionType: "PERCENTAGE", actionValue: 0, customerType: "ALL",
      });
    }
  }, [initialData, form, isOpen]);

  const onSubmit = (data: RuleFormValues) => {
    const conditions: RuleConditions = {};
    if (data.minOrderAmount && data.minOrderAmount > 0) conditions.minOrderAmount = data.minOrderAmount;
    if (data.customerType && data.customerType !== "ALL") conditions.customerType = data.customerType;
    if (data.requiredCategoryIds) {
      conditions.categoryIds = data.requiredCategoryIds.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (Object.keys(conditions).length === 0) conditions.alwaysTrue = true;

    const payload: RulePayload = {
      id:                  data.id,
      name:                data.name,
      isActive:            data.isActive,
      priority:            data.priority,
      conditions,
      action:              { type: data.actionType, value: data.actionValue },
      startDate:           data.startDate || null,
      endDate:             data.endDate   || null,
      affiliateSpecificIds: [],
    };

    startTransition(async () => {
      const res = await upsertRuleAction(payload);
      if (res.success) { toast.success(res.message); onClose(); window.location.reload(); }
      else toast.error(res.message);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div
        className="bg-white border border-[#c3c4c7] shadow-xl w-full max-w-xl flex flex-col max-h-[90vh]"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center bg-[#f6f7f7] shrink-0">
          <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">
            {initialData ? "Edit Commission Rule" : "Create Commission Rule"}
          </h3>
          <button onClick={onClose} className="p-1 text-[#50575e] hover:text-[#d63638] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <form id="rule-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Name + Priority */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Rule Name</label>
                <input
                  {...form.register("name", { required: true })}
                  placeholder="e.g. Black Friday Boost"
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]/20"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Priority</label>
                <input
                  type="number"
                  {...form.register("priority", { valueAsNumber: true })}
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] outline-none focus:border-[#2271b1]"
                />
                <p className="text-[11px] text-[#8c8f94] mt-0.5">Higher = first</p>
              </div>
            </div>

            {/* Conditions */}
            <div className="border border-[#c3c4c7] bg-[#f6f7f7]">
              <div className="px-3 py-2 border-b border-[#c3c4c7] flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#50575e]" />
                <span className="text-[13px] font-semibold text-[#1d2327]">Trigger Conditions (IF)</span>
              </div>
              <div className="p-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-[#50575e] block mb-1">Customer Type</label>
                  <select
                    {...form.register("customerType")}
                    className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
                  >
                    <option value="ALL">Any Customer</option>
                    <option value="NEW">New Customers Only</option>
                    <option value="RETURNING">Returning Customers</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#50575e] block mb-1">Min. Order Value ({currency})</label>
                  <input
                    type="number"
                    placeholder="0"
                    {...form.register("minOrderAmount", { valueAsNumber: true })}
                    className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[12px] font-semibold text-[#50575e] block mb-1">Category IDs <span className="font-normal text-[#8c8f94]">(Optional, comma-separated)</span></label>
                  <input
                    type="text"
                    placeholder="e.g. cat_123, cat_456"
                    {...form.register("requiredCategoryIds")}
                    className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
                  />
                </div>
              </div>
            </div>

            {/* Action / Reward */}
            <div className="border border-[#00a32a]/30 bg-[#edfaef]">
              <div className="px-3 py-2 border-b border-[#00a32a]/20 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#00a32a]" />
                <span className="text-[13px] font-semibold text-[#1d2327]">Reward / Commission (THEN)</span>
              </div>
              <div className="p-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-[#50575e] block mb-1">Commission Type</label>
                  <select
                    {...form.register("actionType")}
                    className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
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
                    {...form.register("actionValue", { required: true, min: 0, valueAsNumber: true })}
                    className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
                  />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Start Date <span className="font-normal text-[#8c8f94]">(Optional)</span></label>
                <input
                  type="date"
                  {...form.register("startDate")}
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">End Date <span className="font-normal text-[#8c8f94]">(Optional)</span></label>
                <input
                  type="date"
                  {...form.register("endDate")}
                  className="w-full h-8 border border-[#c3c4c7] rounded px-2 text-[13px] bg-white outline-none focus:border-[#2271b1]"
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActive"
                {...form.register("isActive")}
                className="w-4 h-4 rounded border-[#c3c4c7] text-[#2271b1] focus:ring-[#2271b1] cursor-pointer"
              />
              <label htmlFor="isActive" className="text-[13px] text-[#1d2327] cursor-pointer select-none">
                Rule is active
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#c3c4c7] bg-[#f6f7f7] flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 border border-[#c3c4c7] bg-white text-[#1d2327] text-[13px] rounded hover:bg-[#f0f0f1] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="rule-form"
            disabled={isPending}
            className="h-8 px-4 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {initialData ? "Update Rule" : "Create Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}
