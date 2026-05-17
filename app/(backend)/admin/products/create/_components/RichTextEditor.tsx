// app/admin/products/create/_components/RichTextEditor.tsx

"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css"; 
import { Code, Eye, Type, Copy, Check } from "lucide-react";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    label: string;
}

export default function RichTextEditor({ value, onChange, label }: RichTextEditorProps) {
    const ReactQuill = useMemo(() => dynamic(() => import("react-quill-new"), { ssr: false }), []);
    const [activeTab, setActiveTab] = useState<"visual" | "code" | "preview">("visual");
    const [copied, setCopied] = useState(false);

    const modules = useMemo(() => ({
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ["bold", "italic", "underline", "strike", "blockquote", "code-block"],
            [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            ["link", "image", "video"],
            ["clean"],
        ],
    }), []);

    const copyToClipboard = useCallback(() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [value]);

    return (
        <div className="bg-white border border-gray-300 rounded-sm shadow-sm mt-2 flex flex-col h-full">
            
            <div className="flex flex-col sm:flex-row justify-between items-center px-3 py-2 border-b border-gray-300 bg-gray-50">
                <span className="font-semibold text-xs text-gray-700 uppercase tracking-wide mb-2 sm:mb-0">{label}</span>
                
                <div className="flex bg-gray-200 rounded p-1 gap-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab("visual")}
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition ${
                            activeTab === "visual" ? "bg-white text-[#2271b1] shadow-sm" : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        <Type size={14} /> Visual
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("code")}
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition ${
                            activeTab === "code" ? "bg-white text-[#2271b1] shadow-sm" : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        <Code size={14} /> Code
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("preview")}
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition ${
                            activeTab === "preview" ? "bg-white text-[#2271b1] shadow-sm" : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        <Eye size={14} /> Preview
                    </button>
                </div>
            </div>

            <div className="relative min-h-[300px] flex-1">
                
                {activeTab === "visual" && (
                    <ReactQuill 
                        theme="snow" 
                        value={value} 
                        onChange={onChange} 
                        modules={modules}
                        className="h-[250px]"
                    />
                )}

                {activeTab === "code" && (
                    <div className="relative h-full">
                        <textarea
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full h-[300px] p-4 font-mono text-sm bg-[#1e1e1e] text-green-400 outline-none resize-y"
                            spellCheck={false}
                        />
                        <button 
                            onClick={copyToClipboard}
                            className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white transition"
                            title="Copy HTML"
                        >
                            {copied ? <Check size={14}/> : <Copy size={14}/>}
                        </button>
                    </div>
                )}

                {activeTab === "preview" && (
                    <div className="p-5 h-[300px] overflow-y-auto bg-white prose max-w-none border-b border-gray-200">
                        <div dangerouslySetInnerHTML={{ __html: value }} />
                        
                        {value.trim() === "" && (
                            <p className="text-gray-400 italic text-center mt-10">Nothing to preview...</p>
                        )}
                    </div>
                )}

            </div>
            
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-500 flex justify-between mt-auto">
                {activeTab === 'visual' && <span>WYSIWYG Mode Active</span>}
                {activeTab === 'code' && <span>HTML Source Editor</span>}
                {activeTab === 'preview' && <span>Live Content Preview</span>}
                <span>{value.length} characters</span>
            </div>
        </div>
    );
}