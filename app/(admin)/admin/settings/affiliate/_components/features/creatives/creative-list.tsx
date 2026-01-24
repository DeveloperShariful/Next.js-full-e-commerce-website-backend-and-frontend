// File: app/(admin)/admin/settings/affiliate/_components/features/creatives/creative-list.tsx

"use client";

import { useState, useTransition } from "react";
import { AffiliateCreative } from "@prisma/client";
import { Edit, Trash2, Image as ImageIcon, Link as LinkIcon, Copy, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import CreativeModal from "./creative-modal";
import { deleteCreativeAction } from "@/app/actions/admin/settings/affiliate/mutations/manage-creatives";

interface Props {
  initialCreatives: AffiliateCreative[];
}

export default function CreativeList({ initialCreatives }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AffiliateCreative | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: AffiliateCreative) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    
    startDelete(async () => {
      const result = await deleteCreativeAction(id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL copied to clipboard!");
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {/* Actions Header */}
        <div className="p-4 border-b bg-gray-50 flex justify-end">
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </button>
        </div>

        {/* Grid Layout for Assets */}
        {initialCreatives.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ImageIcon className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p>No creative assets found. Upload your first banner.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {initialCreatives.map((item) => (
              <div key={item.id} className="group border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white flex flex-col">
                {/* Preview Area */}
                <div className="aspect-video bg-gray-100 relative flex items-center justify-center overflow-hidden">
                  {item.type === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={item.url} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                      <LinkIcon className="w-8 h-8 mb-2" />
                      <span className="text-xs uppercase font-medium">{item.type}</span>
                    </div>
                  )}
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting}
                      className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate pr-2" title={item.title}>
                      {item.title}
                    </h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${item.isActive ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                      {item.isActive ? "Active" : "Draft"}
                    </span>
                  </div>
                  
                  <div className="mt-auto space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <span className="truncate max-w-[150px]">{item.url}</span>
                      <button onClick={() => copyToClipboard(item.url)} title="Copy URL">
                        <Copy className="w-3 h-3 hover:text-black" />
                      </button>
                    </div>
                    {item.targetUrl && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate">Points to: {item.targetUrl}</span>
                      </div>
                    )}
                    {item.width && item.height && (
                      <p className="text-[10px] text-gray-400">
                        Size: {item.width}x{item.height}px
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <CreativeModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          initialData={editingItem} 
        />
      )}
    </>
  );
}