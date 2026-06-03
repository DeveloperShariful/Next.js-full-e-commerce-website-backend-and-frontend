//app/admin/settings/email/_components/rich-text-editor.tsx

"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css"; 
import { Code, Eye, Type, Copy, Check } from "lucide-react";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export default function RichTextEditor({ value, onChange, label }: RichTextEditorProps) {
    const ReactQuill = useMemo(() => dynamic(() => import("react-quill-new"), { ssr: false }), []);
    const [activeTab, setActiveTab] = useState<"visual" | "code" | "preview">("visual");
    const [copied, setCopied] = useState(false);

    const modules = useMemo(() => ({
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike", "blockquote"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            ["link", "image"],
            ["clean"],
        ],
    }), []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white border border-gray-300 rounded-md shadow-sm flex flex-col h-full overflow-hidden">
            
            <div className="flex justify-between items-center px-3 py-2 border-b border-gray-200 bg-gray-50">
                <span className="font-semibold text-xs text-gray-700 uppercase tracking-wide">{label || "Email Content"}</span>
                
                <div className="flex bg-gray-200/50 rounded p-0.5 gap-0.5">
                    <button
                        type="button"
                        onClick={() => setActiveTab("visual")}
                        className={`flex items-center gap-1 px-3 py-1 text-[10px] font-medium rounded transition ${
                            activeTab === "visual" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <Type size={12} /> Visual
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("code")}
                        className={`flex items-center gap-1 px-3 py-1 text-[10px] font-medium rounded transition ${
                            activeTab === "code" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <Code size={12} /> HTML
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("preview")}
                        className={`flex items-center gap-1 px-3 py-1 text-[10px] font-medium rounded transition ${
                            activeTab === "preview" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <Eye size={12} /> Preview
                    </button>
                </div>
            </div>

            <div className="relative flex-1 min-h-[300px]">
                {activeTab === "visual" && (
                    <ReactQuill 
                        theme="snow" 
                        value={value} 
                        onChange={onChange} 
                        modules={modules}
                        className="h-full flex flex-col [&>.ql-container]:flex-1 [&>.ql-container]:border-0 [&>.ql-toolbar]:border-0 [&>.ql-toolbar]:border-b [&>.ql-toolbar]:border-gray-200"
                    />
                )}

                {activeTab === "code" && (
                    <div className="relative h-full">
                        <textarea
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full h-full p-4 font-mono text-xs bg-[#1e1e1e] text-green-400 outline-none resize-none"
                            spellCheck={false}
                        />
                        <button 
                            type="button"
                            onClick={copyToClipboard}
                            className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white transition"
                            title="Copy HTML"
                        >
                            {copied ? <Check size={14}/> : <Copy size={14}/>}
                        </button>
                    </div>
                )}

                {activeTab === "preview" && (
                    <div className="p-6 h-full overflow-y-auto bg-gray-100">
                        <div className="bg-white shadow-sm p-8 max-w-2xl mx-auto rounded border border-gray-200 min-h-[200px]" dangerouslySetInnerHTML={{ __html: value }} />
                    </div>
                )}
            </div>
        </div>
    );
}