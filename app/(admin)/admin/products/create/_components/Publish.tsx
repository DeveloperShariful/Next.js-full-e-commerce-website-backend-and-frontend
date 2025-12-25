// app/admin/products/create/_components/publish.tsx

import { ComponentProps } from "../types";
import { ChevronUp, Calendar } from "lucide-react";

interface Props extends ComponentProps {
    onSubmit: (e?: React.FormEvent) => void;
}

export default function Publish({ data, updateData, loading, onSubmit }: Props) {
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
                        className="font-bold bg-white border border-gray-300 rounded px-1"
                    >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <button type="button" className="text-red-600 hover:underline text-xs">Move to trash</button>
                    <button 
                        onClick={() => onSubmit()} 
                        disabled={loading}
                        className="px-3 py-1.5 bg-[#2271b1] text-white font-bold rounded text-xs hover:bg-[#135e96] disabled:opacity-50"
                    >
                        {loading ? "Publishing..." : "Publish"}
                    </button>
                </div>
            </div>
        </div>
    );
}