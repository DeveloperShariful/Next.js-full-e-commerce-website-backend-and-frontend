// app/admin/products/create/_components/Publish.tsx

"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";
import { ChevronUp, ChevronDown, Trash2, Star, Key, Eye } from "lucide-react"; 
import { toast } from "sonner";
import { moveToTrash } from "@/app/actions/backend/product/product-list";
import { ProductFormData } from "../types";

interface Props {
    loading: boolean;
    isEdit: boolean;
    onSubmit: () => void;
}

export default function Publish({ loading, isEdit, onSubmit }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isExpanded, setIsExpanded] = useState(true);
    
    const { watch, setValue } = useFormContext<ProductFormData>();
    const id = watch("id");
    const isFeatured = watch("isFeatured");
    const status = watch("status");

    const handleTrash = () => {
        if (!id) return;
        const confirm = window.confirm("Are you sure you want to move this product to trash?");
        if (!confirm) return;

        startTransition(async () => {
            try {
                await moveToTrash(id);
                toast.success("Moved to trash");
                router.push("/admin/products");
            } catch (error) {
                toast.error("Failed to move to trash");
            }
        });
    };

    return (
        // 🚀 WP Style Meta Box
        <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-[3px]">
            
            {/* Header */}
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex justify-between items-center px-3 py-2 border-b border-[#f0f0f1] bg-white cursor-pointer select-none"
            >
                <span className="font-semibold text-[14px] text-[#1d2327]">Publish</span>
                {isExpanded ? <ChevronUp size={16} className="text-[#8c8f94]" /> : <ChevronDown size={16} className="text-[#8c8f94]" />}
            </div>
            
            {isExpanded && (
                <div className="bg-white">
                    {/* Status & Visibility Info */}
                    <div className="p-3 space-y-3 border-b border-[#f0f0f1] text-[13px] text-[#3c434a]">
                        
                        {/* Status */}
                        <div className="flex items-center gap-2">
                            <Key size={14} className="text-[#8c8f94]" />
                            <span className="text-[#646970]">Status:</span>
                            <span className="font-bold">
                                {status === "ACTIVE" ? "Published" : status === "ARCHIVED" ? "Archived" : "Draft"}
                            </span>
                            <select
                                value={status || "DRAFT"}
                                onChange={(e) => setValue("status", e.target.value as ProductFormData["status"], { shouldDirty: true })}
                                className="ml-auto text-[12px] bg-[#f6f7f7] border border-[#8c8f94] rounded-[3px] px-1 focus:border-[#2271b1] outline-none"
                            >
                                <option value="DRAFT">Draft</option>
                                <option value="ACTIVE">Active</option>
                                <option value="ARCHIVED">Archived</option>
                            </select>
                        </div>

                        {/* Visibility (Featured) */}
                        <div className="flex items-center gap-2">
                            <Eye size={14} className="text-[#8c8f94]" />
                            <span className="text-[#646970]">Visibility:</span>
                            <span className="font-bold">Public</span>
                        </div>
                        
                        <div className="pl-6">
                            <label className="flex items-center gap-2 text-[13px] text-[#3c434a] cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={!!isFeatured}
                                    onChange={(e) => setValue("isFeatured", e.target.checked, { shouldDirty: true })}
                                    className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                                />
                                <span className="flex items-center gap-1">
                                    <Star size={12} className={isFeatured ? "fill-[#f56e28] text-[#f56e28]" : "text-[#8c8f94]"}/>
                                    This is a featured product
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="p-3 bg-[#f6f7f7] flex justify-between items-center">
                        {isEdit && id ? (
                            <button 
                                type="button" 
                                onClick={handleTrash}
                                disabled={isPending || loading}
                                className="text-[#d63638] hover:underline text-[13px] flex items-center gap-1 disabled:opacity-50"
                            >
                                {isPending ? "Moving..." : "Move to Trash"}
                            </button>
                        ) : (
                            <div></div> 
                        )}

                        {/* 🚀 Main Submit Button */}
                        <button 
                            type="button"
                            onClick={onSubmit} 
                            disabled={loading || isPending}
                            className="px-4 py-1.5 bg-[#2271b1] text-white font-medium rounded-[3px] border border-[#2271b1] text-[13px] hover:bg-[#135e96] hover:border-[#135e96] disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Saving...
                                </>
                            ) : isEdit ? (
                                "Update"
                            ) : (
                                "Publish"
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}