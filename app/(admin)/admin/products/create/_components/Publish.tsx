import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ComponentProps } from "../types";
import { ChevronUp, Trash2 } from "lucide-react"; // Icon updated
import { toast } from "react-hot-toast";
import { moveToTrash } from "@/app/actions/admin/product/product-list";

interface Props extends ComponentProps {
    onSubmit: (e?: React.FormEvent) => void;
}

export default function Publish({ data, updateData, loading, onSubmit }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleTrash = () => {
        if (!data.id) return;
        
        const confirm = window.confirm("Are you sure you want to move this product to trash?");
        if (!confirm) return;

        startTransition(async () => {
            try {
                await moveToTrash(data.id as string);
                toast.success("Moved to trash");
                router.push("/admin/products");
            } catch (error) {
                toast.error("Failed to move to trash");
            }
        });
    };

    return (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
            <div className="flex justify-between items-center px-3 py-2 border-b border-gray-300 bg-gray-50 font-semibold text-xs text-gray-700">
                <span>Publish</span>
                <ChevronUp size={14} />
            </div>
            <div className="p-3 space-y-3">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">Status:</span>
                    <select 
                        value={data.status} 
                        onChange={e => updateData('status', e.target.value)} 
                        className="font-bold bg-white border border-gray-300 rounded px-1 outline-none focus:border-[#2271b1]"
                    >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    {/* Trash Button Logic Added */}
                    {data.id ? (
                        <button 
                            type="button" 
                            onClick={handleTrash}
                            disabled={isPending || loading}
                            className="text-red-600 hover:underline text-xs flex items-center gap-1 disabled:opacity-50"
                        >
                            {isPending ? "Moving..." : "Move to trash"}
                        </button>
                    ) : (
                        <div></div> // Empty div to keep layout consistent for new products
                    )}

                    <button 
                        onClick={() => onSubmit()} 
                        disabled={loading || isPending}
                        className="px-3 py-1.5 bg-[#2271b1] text-white font-bold rounded text-xs hover:bg-[#135e96] disabled:opacity-50 transition"
                    >
                        {loading ? "Saving..." : data.id ? "Update" : "Publish"}
                    </button>
                </div>
            </div>
        </div>
    );
}