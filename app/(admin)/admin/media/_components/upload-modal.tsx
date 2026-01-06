//app/(admin)/admin/media/_components/upload-model.tsx

"use client";

import { useState } from "react";
import { saveMedia } from "@/app/actions/admin/media/media-create";
import { X, CheckCircle, FileCheck } from "lucide-react";
import ImageUpload from "@/components/ui/image-upload";
import { toast } from "react-hot-toast";

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleUploadSuccess = async (result: any) => {
    setProcessing(true);
    const info = result.info;

    try {
        const fileData = {
            url: info.secure_url,
            publicId: info.public_id,
            originalName: info.original_filename,
            filename: `${info.original_filename}.${info.format}`,
            mimeType: `${info.resource_type}/${info.format}`,
            size: info.bytes,
            width: info.width || 0,
            height: info.height || 0
        };

        const res = await saveMedia(fileData);
        
        if (res.success) {
            // লিস্টে যোগ করছি (যাতে ইউজার দেখে কয়টা আপলোড হলো)
            setUploadedFiles((prev) => [...prev, fileData.filename]);
            toast.success(`Uploaded: ${fileData.originalName}`);
        } else {
            toast.error(`Failed: ${fileData.originalName}`);
        }

    } catch (error) {
        console.error("Upload Error", error);
    } finally {
        setProcessing(false);
        // ❌ আমরা এখানে onSuccess() কল করব না, যাতে মডাল বন্ধ না হয়ে যায়।
    }
  };

  const handleFinish = () => {
      onSuccess(); // রিফ্রেশ লিস্ট
      onClose();   // মডাল বন্ধ
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <h3 className="font-bold text-slate-800">Upload Media</h3>
           <button onClick={onClose}><X className="text-slate-400 hover:text-red-500 transition"/></button>
        </div>
        
        <div className="p-8">
           {/* Upload Widget */}
           <div className="w-full mb-6">
              <ImageUpload 
                 value={[]} 
                 onChange={() => {}} 
                 onRemove={() => {}} 
                 onUploadSuccess={handleUploadSuccess} 
                 showPreview={false} 
              />
           </div>

           {/* Uploaded List Status */}
           {uploadedFiles.length > 0 && (
               <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4">
                   <div className="flex items-center gap-2 mb-2 text-green-700 font-bold text-sm">
                       <CheckCircle size={16}/>
                       <span>{uploadedFiles.length} Files Uploaded Successfully</span>
                   </div>
                   <ul className="text-xs text-green-600 space-y-1 max-h-32 overflow-y-auto pl-6 list-disc">
                       {uploadedFiles.map((fname, i) => (
                           <li key={i}>{fname}</li>
                       ))}
                   </ul>
               </div>
           )}

           {processing && (
               <p className="text-center text-xs text-indigo-600 animate-pulse font-medium mb-4">
                   Processing latest file...
               </p>
           )}

           {/* Finish Button */}
           <button 
             onClick={handleFinish}
             className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition shadow-sm"
           >
             {uploadedFiles.length > 0 ? "Done & Refresh Library" : "Close"}
           </button>

        </div>
      </div>
    </div>
  );
}