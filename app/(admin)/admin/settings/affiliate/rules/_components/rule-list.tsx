// File: app/(admin)/admin/settings/affiliate/rules/_components/rule-list.tsx

"use client";

import { useState, useTransition } from "react";
import { AffiliateCommissionRule } from "@prisma/client";
import { Edit, Trash2, GripVertical, CheckCircle, XCircle, Plus, Calculator } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import RuleModal from "./rule-modal";
import { deleteRuleAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-rules";

interface Props {
  initialRules: AffiliateCommissionRule[];
}

export default function RuleList({ initialRules }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AffiliateCommissionRule | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const handleCreate = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleEdit = (rule: AffiliateCommissionRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure? This will permanently delete this logic rule.")) return;
    
    startDelete(async () => {
      const result = await deleteRuleAction(id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  // Helper to parse JSON Action safely
  const getActionSummary = (action: any) => {
    if (!action || typeof action !== 'object') return "N/A";
    const val = action.value;
    const type = action.type === "PERCENTAGE" ? "%" : "$";
    return `Commission: ${val}${type}`;
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {/* Actions Header */}
        <div className="p-4 border-b bg-gray-50 flex justify-end">
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Rule
          </button>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-100">
          {initialRules.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Calculator className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p>No rules defined. Tiers will be used by default.</p>
            </div>
          ) : (
            initialRules.map((rule, index) => (
              <div 
                key={rule.id} 
                className="group flex items-center justify-between p-4 hover:bg-gray-50 transition-all"
              >
                {/* Left: Info */}
                <div className="flex items-start gap-4">
                  <div className="mt-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{rule.name}</span>
                      {rule.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                      <span className="text-xs text-gray-400 border px-1.5 rounded">
                        Priority: {rule.priority}
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-gray-500 flex items-center gap-3">
                      <span className="font-mono text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                        {getActionSummary(rule.action)}
                      </span>
                      {rule.endDate && (
                        <span className="text-xs">
                          Expires: {format(new Date(rule.endDate), "dd MMM yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    disabled={isDeleting}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
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