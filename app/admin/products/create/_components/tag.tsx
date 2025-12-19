import { useState } from "react";
import { ComponentProps } from "../types";
import { X } from "lucide-react";

export default function Tag({ data, updateData }: ComponentProps) {
    const [input, setInput] = useState("");

    const addTag = () => {
        if(input.trim()) {
            updateData('tags', [...data.tags, input.trim()]);
            setInput("");
        }
    };

    return (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
            <div className="px-3 py-2 border-b border-gray-300 bg-gray-50 font-semibold text-xs text-gray-700">Tags</div>
            <div className="p-3">
                <div className="flex gap-2 mb-2">
                    <input 
                        value={input} 
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="flex-1 border border-gray-300 px-2 py-1 text-xs outline-none focus:border-[#2271b1]" 
                        placeholder="Add tag..."
                    />
                    <button type="button" onClick={addTag} className="px-3 py-1 bg-gray-100 border border-gray-300 text-xs text-[#2271b1] hover:bg-gray-200">Add</button>
                </div>
                <div className="flex flex-wrap gap-1">
                    {data.tags.map(t => (
                        <span key={t} className="bg-gray-100 text-xs px-2 py-1 rounded flex items-center gap-1 border border-gray-200">
                            {t} <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => updateData('tags', data.tags.filter(x => x !== t))} />
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}