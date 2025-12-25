"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css"; // 🔥 UPDATED CSS IMPORT
import { Code, Eye, Type } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export default function RichTextEditor({ value, onChange, label }: RichTextEditorProps) {
  // 🔥 UPDATED: Dynamic import from 'react-quill-new' to fix React 19 issues
  const ReactQuill = useMemo(() => dynamic(() => import("react-quill-new"), { ssr: false }), []);

  // Tabs State
  const [activeTab, setActiveTab] = useState<"visual" | "code" | "preview">("visual");

  // Quill Toolbar Configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }], // Text Color & Background
      ["link", "image", "video"], // Added Video support
      ["clean"],
    ],
  };

  return (
    <div className="bg-white border border-gray-300 rounded-sm shadow-sm mt-2">
      
      {/* --- HEADER & TABS --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-3 py-2 border-b border-gray-300 bg-gray-50">
        <span className="font-semibold text-xs text-gray-700 uppercase tracking-wide mb-2 sm:mb-0">{label}</span>
        
        <div className="flex bg-gray-200 rounded p-1 gap-1">
            {/* Visual Tab */}
            <button
                type="button"
                onClick={() => setActiveTab("visual")}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition ${
                    activeTab === "visual" ? "bg-white text-[#2271b1] shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
            >
                <Type size={14} /> Visual
            </button>

            {/* Code Tab */}
            <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition ${
                    activeTab === "code" ? "bg-white text-[#2271b1] shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
            >
                <Code size={14} /> Code
            </button>

            {/* Preview Tab */}
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

      {/* --- EDITOR BODY --- */}
      <div className="relative min-h-[300px]">
        
        {/* 1. VISUAL MODE */}
        {activeTab === "visual" && (
            <ReactQuill 
                theme="snow" 
                value={value} 
                onChange={onChange} 
                modules={modules}
                className="h-[250px]"
            />
        )}

        {/* 2. CODE MODE (Raw HTML/JS/PHP Editor) */}
        {activeTab === "code" && (
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-[300px] p-4 font-mono text-sm bg-[#1e1e1e] text-green-400 outline-none resize-y"
                placeholder=""
                spellCheck={false}
            />
        )}

        {/* 3. PREVIEW MODE */}
        {activeTab === "preview" && (
            <div className="p-5 h-[300px] overflow-y-auto bg-white prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: value }} />
                
                {value.trim() === "" && (
                    <p className="text-gray-400 italic text-center mt-10">Nothing to preview...</p>
                )}
            </div>
        )}

      </div>
      
      {/* Footer Info */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-500 flex justify-between mt-auto">
         {activeTab === 'visual' && <span>Editing visually</span>}
         {activeTab === 'code' && <span>Editing raw source code</span>}
         {activeTab === 'preview' && <span>Live Preview Mode</span>}
      </div>
    </div>
  );
}