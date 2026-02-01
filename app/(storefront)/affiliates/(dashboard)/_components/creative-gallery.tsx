//app/(storefront)/affiliates/_components/creative-gallery.tsx

"use client";

import { useState } from "react";
import { Download, Copy, Check, FileText, PlayCircle, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Creative {
  id: string;
  title: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
  url: string;
  width?: number | null;
  height?: number | null;
}

export default function CreativeGallery({ creatives }: { creatives: Creative[] }) {
  const [filter, setFilter] = useState<"ALL" | "IMAGE" | "VIDEO">("ALL");

  const filtered = creatives.filter(c => filter === "ALL" || c.type === filter);

  const copyEmbedCode = (url: string, type: string) => {
    const code = type === "IMAGE" 
      ? `<a href="${window.location.origin}"><img src="${url}" alt="Partner Banner" /></a>`
      : url;
    
    navigator.clipboard.writeText(code);
    toast.success("Embed code copied!");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-600" /> Marketing Assets
        </h3>
        
        <div className="flex p-1 bg-gray-100 rounded-lg">
          {["ALL", "IMAGE", "VIDEO"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-md transition-all",
                filter === type ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
          <ImageIcon className="w-10 h-10 mb-2 opacity-20" />
          <p>No creative assets found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div key={item.id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
              
              {/* Preview */}
              <div className="aspect-video bg-gray-100 relative flex items-center justify-center overflow-hidden">
                {item.type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.title} className="w-full h-full object-contain p-2" loading="lazy" />
                ) : item.type === "VIDEO" ? (
                  <PlayCircle className="w-12 h-12 text-gray-400" />
                ) : (
                  <FileText className="w-12 h-12 text-gray-400" />
                )}
                
                {/* Download Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                  <a href={item.url} target="_blank" download className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Info & Actions */}
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 truncate" title={item.title}>{item.title}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {item.type} • {item.width && item.height ? `${item.width}x${item.height}px` : "Responsive"}
                </p>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => copyEmbedCode(item.url, item.type)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-lg border border-gray-200 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Embed Code
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}