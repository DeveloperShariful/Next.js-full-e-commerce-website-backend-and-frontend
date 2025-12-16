"use client";

import { useState } from "react";
import { saveMedia } from "@/app/actions/media";
import { X, Loader2 } from "lucide-react";
import ImageUpload from "@/components/ui/image-upload"; // Ensure this path is correct
import { toast } from "react-hot-toast";

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (url: string) => {
    setUploading(true);
    // Mock metadata - in real case, get this from upload response
    const mockMeta = {
      filename: url.split('/').pop() || "uploaded.jpg",
      size: 1024 * 50, 
      mimeType: "image/jpeg"
    };

    const res = await saveMedia({
      url,
      ...mockMeta
    });
    
    setUploading(false);

    if (res.success) {
      toast.success("File uploaded successfully");
      onSuccess();
      onClose();
    } else {
      toast.error("Database save failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <h3 className="font-bold text-slate-800">Upload Media</h3>
           <button onClick={onClose}><X className="text-slate-400 hover:text-red-500 transition"/></button>
        </div>
        
        <div className="p-8">
           {uploading ? (
              <div className="py-12 flex flex-col items-center gap-4 text-center">
                 <Loader2 className="animate-spin text-indigo-600" size={48}/>
                 <div>
                    <p className="text-sm font-bold text-slate-700">Processing file...</p>
                    <p className="text-xs text-slate-500">Optimizing and saving to library</p>
                 </div>
              </div>
           ) : (
              <div className="w-full">
                 <ImageUpload 
                    value={[]} 
                    disabled={uploading}
                    onChange={handleUpload}
                    onRemove={() => {}}
                 />
                 <p className="text-center text-xs text-slate-400 mt-4">
                    Supports JPG, PNG, WEBP, PDF (Max 10MB)
                 </p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}