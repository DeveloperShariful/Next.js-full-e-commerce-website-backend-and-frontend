// File Location: app/admin/orders/[orderId]/_components/custom-fields-meta.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateOrderMetadata, deleteOrderMetadata, getUniqueMetaKeys } from "@/app/actions/backend/order/order-meta-actions";

import { OrderMetaBase } from "../types";

interface CustomFieldsMetaProps {
  order: OrderMetaBase;
}

export const CustomFieldsMeta = ({ order }: CustomFieldsMetaProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  // Dynamic Keys State
  const [dynamicKeys, setDynamicKeys] = useState<string[]>([]);
  const [loadingKeys, setLoadingKeys] = useState<boolean>(true);

  // Fetch unique keys across the entire store on mount
  useEffect(() => {
    const fetchKeys = async () => {
        const res = await getUniqueMetaKeys();
        if (res.success && res.data) {
            setDynamicKeys(res.data);
        }
        setLoadingKeys(false);
    };
    fetchKeys();
  }, []);

  // ✅ STRICT JSON PARSING
  const metadataObj = typeof order.metadata === 'object' && order.metadata !== null 
    ? (order.metadata as unknown as Record<string, unknown>)
    : {};

  const systemKeys = ['downloadable_permissions', 'stripe_intent', 'paypal_id'];
  const customFieldsArray = Object.entries(metadataObj).filter(([key]) => !systemKeys.includes(key));

  // States for Adding New Field
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [customKey, setCustomKey] = useState<string>(""); 
  const [isEnteringNew, setIsEnteringNew] = useState<boolean>(false);
  const [newValue, setNewValue] = useState<string>("");

  // States for Updating Existing Fields
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // --- HANDLER: ADD CUSTOM FIELD ---
  const handleAddField = () => {
    const finalKey = isEnteringNew ? customKey.trim() : selectedKey;
    const finalValue = newValue.trim();

    if (!finalKey) return toast.error("Please enter or select a Name.");

    startTransition(async () => {
        const res = await updateOrderMetadata(order.id, finalKey, finalValue);
        if (res.success) {
            toast.success(res.message);
            setSelectedKey("");
            setCustomKey("");
            setNewValue("");
            setIsEnteringNew(false);
            
            // Add new key to dynamic list if not present
            if (!dynamicKeys.includes(finalKey)) {
                setDynamicKeys(prev => [...prev, finalKey].sort());
            }
        } else {
            toast.error(res.error || "Failed to add custom field.");
        }
    });
  };

  // --- HANDLER: UPDATE EXISTING FIELD ---
  const handleUpdateField = (key: string) => {
    const finalValue = editValues[key];
    if (finalValue === undefined) return;

    startTransition(async () => {
        const res = await updateOrderMetadata(order.id, key, finalValue);
        if (res.success) toast.success("Updated successfully.");
        else toast.error(res.error || "Failed to update field.");
    });
  };

  // --- HANDLER: DELETE FIELD ---
  const handleDeleteField = (key: string) => {
    if(!confirm(`Are you sure you want to delete the custom field '${key}'?`)) return;

    startTransition(async () => {
        const res = await deleteOrderMetadata(order.id, key);
        if (res.success) toast.success(res.message);
        else toast.error(res.error || "Failed to delete field.");
    });
  };

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mb-5">
      
      {/* WordPress Meta Box Header (Collapsible) */}
      <div 
        className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none bg-white hover:bg-[#f6f7f7] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">Custom Fields</h2>
        <button type="button" className="text-[#646970]">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Meta Box Content */}
      {isOpen && (
        <div className="p-4 bg-[#f0f0f1]">
            
            {/* 1. Existing Custom Fields Table */}
            <div className="bg-white border border-[#c3c4c7] mb-4">
                <table className="w-full text-[13px] text-left border-collapse">
                    <thead>
                        <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
                            <th className="py-2 px-3 font-semibold text-[#1d2327] w-[35%]">Name</th>
                            <th className="py-2 px-3 font-semibold text-[#1d2327]">Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f1]">
                        {customFieldsArray.length === 0 ? (
                            <tr>
                                <td colSpan={2} className="py-4 text-center text-[#646970] italic">
                                    No custom fields found.
                                </td>
                            </tr>
                        ) : (
                            customFieldsArray.map(([key, val]) => (
                                <tr key={key} className="align-top">
                                    <td className="py-3 px-3">
                                        <input 
                                            type="text" 
                                            value={key} 
                                            readOnly 
                                            className="w-full bg-[#f0f0f1] border border-[#8c8f94] px-2 h-[30px] text-[#646970] cursor-not-allowed mb-2 rounded-[3px]" 
                                        />
                                        <div className="flex gap-2 text-[12px]">
                                            <button 
                                                onClick={() => handleUpdateField(key)}
                                                disabled={isPending}
                                                className="text-[#2271b1] hover:underline disabled:opacity-50"
                                            >
                                                Update
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteField(key)}
                                                disabled={isPending}
                                                className="text-[#d63638] hover:underline disabled:opacity-50"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3">
                                        <textarea 
                                            defaultValue={String(val)}
                                            onChange={(e) => setEditValues({...editValues, [key]: e.target.value})}
                                            className="w-full h-[60px] p-2 border border-[#8c8f94] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] text-[13px] text-[#32373c] shadow-sm rounded-[3px]"
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 2. Add New Custom Field Form */}
            <h3 className="text-[13px] font-semibold text-[#1d2327] mb-2">Add Custom Field:</h3>
            <div className="bg-white border border-[#c3c4c7]">
                <table className="w-full text-[13px] text-left border-collapse">
                    <thead>
                        <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
                            <th className="py-2 px-3 font-semibold text-[#1d2327] w-[35%]">Name</th>
                            <th className="py-2 px-3 font-semibold text-[#1d2327]">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="align-top">
                            <td className="py-3 px-3">
                                {!isEnteringNew ? (
                                    <>
                                        <select 
                                            value={selectedKey}
                                            onChange={(e) => setSelectedKey(e.target.value)}
                                            disabled={loadingKeys}
                                            className="w-full h-[30px] px-2 mb-2 border border-[#8c8f94] bg-white text-[#32373c] outline-none focus:border-[#2271b1] shadow-sm rounded-[3px] disabled:opacity-50"
                                        >
                                            <option value="">— Select —</option>
                                            {dynamicKeys.map(k => (
                                                <option key={k} value={k}>{k}</option>
                                            ))}
                                        </select>
                                        <button 
                                            onClick={() => { setIsEnteringNew(true); setSelectedKey(""); }}
                                            className="border border-[#2271b1] text-[#2271b1] hover:bg-[#f6f7f7] px-3 py-1 text-[12px] rounded-[3px] transition-colors"
                                        >
                                            Enter new
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <input 
                                            type="text" 
                                            value={customKey}
                                            onChange={(e) => setCustomKey(e.target.value)}
                                            placeholder="Enter new key name"
                                            className="w-full h-[30px] px-2 mb-2 border border-[#8c8f94] outline-none focus:border-[#2271b1] shadow-sm rounded-[3px]"
                                        />
                                        <button 
                                            onClick={() => { setIsEnteringNew(false); setCustomKey(""); }}
                                            className="border border-[#8c8f94] text-[#3c434a] hover:bg-[#f6f7f7] px-3 py-1 text-[12px] rounded-[3px] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </td>
                            <td className="py-3 px-3">
                                <textarea 
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    className="w-full h-[60px] p-2 border border-[#8c8f94] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] text-[13px] text-[#32373c] shadow-sm rounded-[3px]"
                                ></textarea>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="p-3 border-t border-[#f0f0f1] bg-[#f6f7f7]">
                    <button 
                        onClick={handleAddField}
                        disabled={isPending || (!selectedKey && !customKey) || !newValue}
                        className="bg-white border border-[#2271b1] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-4 text-[13px] rounded-[3px] font-medium transition-colors disabled:opacity-50 disabled:border-[#8c8f94] disabled:text-[#8c8f94] flex items-center gap-2 shadow-sm"
                    >
                        {isPending && <Loader2 size={14} className="animate-spin"/>}
                        Add Custom Field
                    </button>
                </div>
            </div>

            <p className="text-[12px] text-[#646970] mt-3 mb-0">
                Custom fields can be used to add extra metadata to a post that you can use in your theme.
            </p>
        </div>
      )}
    </div>
  );
};