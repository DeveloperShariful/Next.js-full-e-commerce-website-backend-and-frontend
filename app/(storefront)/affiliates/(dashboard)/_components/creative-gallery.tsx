//app/(storefront)/affiliates/_components/creative-gallery.tsx

"use client";

import { AffiliateCreative } from "@prisma/client";
import { Download, ExternalLink, ImageIcon, Link as LinkIcon, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  creatives: AffiliateCreative[];
}

export default function CreativeGallery({ creatives }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (creatives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-gray-200 rounded-2xl animate-in fade-in">
        <ImageIcon className="w-16 h-16 text-gray-200 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">No assets available</h3>
        <p className="text-sm text-gray-500 mt-1">Check back later for new promotional materials.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
      {creatives.map((item) => (
        <div key={item.id} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
          
          {/* Preview */}
          <div className="relative aspect-video bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100 p-4">
            {item.type === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={item.url} 
                alt={item.title} 
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" 
              />
            ) : (
              <div className="text-center p-6">
                <ExternalLink className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">External Resource</p>
              </div>
            )}
            
            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[1px]">
              <a 
                href={item.url} 
                target="_blank" 
                download 
                className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-100 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          </div>

          {/* Details */}
          <div className="p-5 flex flex-col flex-1">
            <div className="mb-4">
              <h3 className="font-bold text-gray-900 truncate" title={item.title}>
                {item.title}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                {item.width && item.height && <span>{item.width}x{item.height}px</span>}
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="uppercase">{item.type}</span>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              {/* Copy URL */}
              <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg group/input hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-2 overflow-hidden px-1">
                    <LinkIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <code className="text-xs text-gray-600 truncate font-mono">{item.url}</code>
                </div>
                <button 
                    onClick={() => copyToClipboard(item.url, item.id)}
                    className="p-1.5 bg-white border border-gray-200 rounded-md hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
                    title="Copy URL"
                >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-green-600"/> : <Copy className="w-3.5 h-3.5"/>}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}