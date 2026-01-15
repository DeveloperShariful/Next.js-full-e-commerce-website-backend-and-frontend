//app/(admin)/admin/media/_components/media-details.tsx

"use client";

import { useState, useEffect } from "react";
import { updateMediaMetadata } from "@/app/actions/admin/media/media-update"; 
import { MediaItem } from "@/app/actions/admin/media/media-read"; 
import { X, Save, Copy, FileText, Calendar, HardDrive, Check, Loader2, Crop } from "lucide-react";
import { toast } from "react-hot-toast";
import Image from "next/image";

interface MediaDetailsProps {
  file: MediaItem;
  onClose: () => void;
  onUpdate: () => void;
  // 🔥 NEW PROP
  onEdit: () => void;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function MediaDetails({ file, onClose, onUpdate, onEdit }: MediaDetailsProps) {
  const [formData, setFormData] = useState({
    filename: file.filename,
    altText: file.altText || "",
    caption: file.caption || "",
    description: file.description || ""
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setFormData({
      filename: file.filename,
      altText: file.altText || "",
      caption: file.caption || "",
      description: file.description || ""
    });
  }, [file]);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateMediaMetadata(file.id, formData);
    setSaving(false);
    
    if (res.success) {
      toast.success(res.message);
      onUpdate();
    } else {
      toast.error(res.message);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(file.url);
    setCopied(true);
    toast.success("URL copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Attachment Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition"><X size={18}/></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Preview with Edit Button */}
          <div className="bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative group">
             {file.type === 'IMAGE' ? (
                <div className="aspect-video relative">
                   <Image src={file.url} alt={file.filename} fill className="object-contain"/>
                   
                   {/* 🔥 EDIT BUTTON */}
                   <div className="absolute top-2 right-2">
                       <button 
                         onClick={onEdit}
                         className="bg-white/90 hover:bg-white text-slate-700 hover:text-indigo-600 p-2 rounded-full shadow-sm backdrop-blur-sm transition border border-slate-200"
                         title="Crop & Edit Image"
                       >
                           <Crop size={16}/>
                       </button>
                   </div>
                </div>
             ) : (
                <div className="h-40 flex items-center justify-center text-slate-400">
                   <FileText size={48}/>
                </div>
             )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 border-b border-slate-100 pb-6">
             <div>
                <span className="block font-bold text-slate-700 mb-1">Uploaded on</span>
                <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(file.createdAt).toLocaleDateString()}</span>
             </div>
             <div>
                <span className="block font-bold text-slate-700 mb-1">File Size</span>
                <span className="flex items-center gap-1"><HardDrive size={12}/> {formatBytes(file.size)}</span>
             </div>
             <div>
                <span className="block font-bold text-slate-700 mb-1">File Type</span>
                <span className="uppercase">{file.mimeType.split('/')[1] || 'FILE'}</span>
             </div>
             <div>
                <span className="block font-bold text-slate-700 mb-1">Dimensions</span>
                <span>{file.width && file.height ? `${file.width} x ${file.height}` : '-'}</span>
             </div>
          </div>

          {/* Edit Form */}
          <div className="space-y-4">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">File Name</label>
                <input 
                  className="w-full border p-2 rounded text-sm focus:ring-2 ring-blue-100 outline-none"
                  value={formData.filename}
                  onChange={(e) => setFormData({...formData, filename: e.target.value})}
                />
             </div>
             
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Alt Text <span className="text-slate-400 font-normal">(SEO)</span></label>
                <input 
                  className="w-full border p-2 rounded text-sm focus:ring-2 ring-blue-100 outline-none"
                  value={formData.altText}
                  onChange={(e) => setFormData({...formData, altText: e.target.value})}
                  placeholder="Describe image for Google"
                />
             </div>

             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Caption</label>
                <textarea 
                  className="w-full border p-2 rounded text-sm focus:ring-2 ring-blue-100 outline-none"
                  rows={2}
                  value={formData.caption}
                  onChange={(e) => setFormData({...formData, caption: e.target.value})}
                />
             </div>

             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <textarea 
                  className="w-full border p-2 rounded text-sm focus:ring-2 ring-blue-100 outline-none"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
             </div>

             <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-slate-700">File URL</label>
                <div className="flex gap-2">
                   <input readOnly value={file.url} className="w-full bg-slate-50 border p-2 rounded text-xs text-slate-500 select-all"/>
                   <button onClick={copyUrl} className="px-3 border rounded hover:bg-slate-50 transition">
                      {copied ? <Check size={14} className="text-green-600"/> : <Copy size={14}/>}
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
           <button onClick={onUpdate} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800">Cancel</button>
           <button 
             onClick={handleSave} 
             disabled={saving}
             className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2 disabled:opacity-70"
           >
              {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save
           </button>
        </div>

      </div>
    </div>
  );
}