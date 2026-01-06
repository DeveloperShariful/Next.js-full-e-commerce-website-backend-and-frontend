// app/admin/products/create/_components/header.tsx

import { Save } from "lucide-react";
import { BaseSyntheticEvent } from "react";

interface Props {
    loading: boolean;
    // RHF handleSubmit returns a Promise, updated type to fix TS errors
    onSubmit: (e?: BaseSyntheticEvent) => Promise<void>; 
    title: string;
    isEdit: boolean;
}

export default function Header({ loading, onSubmit, title, isEdit }: Props) {
    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-300 shadow-sm">
            <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-gray-800 font-sans">
                    {isEdit ? `Edit Product: ${title || ''}` : "Add New Product"}
                </h1>
                {isEdit && <span className="text-xs text-gray-500 mt-0.5">Editing mode</span>}
            </div>
            <button 
                onClick={onSubmit} 
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white font-bold rounded hover:bg-[#135e96] disabled:opacity-50 transition text-sm shadow-sm"
            >
                <Save size={16} />
                {loading ? "Saving..." : isEdit ? "Update" : "Publish"}
            </button>
        </div>
    );
}