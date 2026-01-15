// app/(admin)/admin/media/_components/image-editor.tsx

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider"; // ✅ Now using it for Rotation
import { Crop, Save, Loader2, RotateCw } from "lucide-react";
import Image from "next/image";
import { saveMedia } from "@/app/actions/admin/media/media-create";
import { toast } from "react-hot-toast";

interface ImageEditorProps {
  file: any; // MediaItem
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImageEditor({ file, isOpen, onClose, onSuccess }: ImageEditorProps) {
  const [loading, setLoading] = useState(false);
  
  // ✅ New State for Rotation
  const [rotation, setRotation] = useState(0);
  const [preset, setPreset] = useState("square"); // square | landscape | portrait

  const handleSaveAsNew = async () => {
    setLoading(true);
    try {
        // Cloudinary Transformation Logic
        // Structure: /upload/ {transformations} /v1234/id
        
        let transformString = "c_fill,g_auto"; // Crop Fill, Gravity Auto (AI)

        // 1. Apply Dimensions based on Preset
        if (preset === "square") transformString += ",w_800,h_800";
        else if (preset === "landscape") transformString += ",w_1200,h_675"; // 16:9
        else if (preset === "portrait") transformString += ",w_800,h_1000"; // 4:5

        // 2. Apply Rotation (Slider Value)
        if (rotation > 0) {
            transformString += `,a_${rotation}`;
        }

        // Generate New URL
        // We replace the "/upload/" part with "/upload/{transforms}/"
        const newUrl = file.url.replace("/upload/", `/upload/${transformString}/`);
        
        const fileData = {
            url: newUrl,
            publicId: `${file.publicId}_edited_${Date.now()}`,
            originalName: `edited-${file.filename}`,
            filename: `edited-${file.filename}`,
            mimeType: file.mimeType,
            size: file.size, // Size will change, but for DB we keep approx until webhook updates
            width: preset === "landscape" ? 1200 : 800,
            height: preset === "landscape" ? 675 : (preset === "portrait" ? 1000 : 800)
        };

        const res = await saveMedia(fileData);
        
        if (res.success) {
            toast.success("New edited version created!");
            onSuccess();
            onClose();
        } else {
            toast.error("Failed to save");
        }

    } catch (error) {
        toast.error("Error processing image");
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] bg-slate-900 text-white border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop size={20} className="text-indigo-400"/> Image Editor (Quick Actions)
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-6 py-4">
            
            {/* Image Preview Area */}
            <div className="flex-1 bg-black/50 rounded-lg flex items-center justify-center p-4 border border-slate-700 min-h-[350px] relative overflow-hidden">
                <div 
                    className="relative w-full h-[300px] transition-transform duration-300 ease-out"
                    style={{ transform: `rotate(${rotation}deg)` }} // ✅ Visual Preview of Rotation
                >
                    <Image 
                        src={file.url} 
                        alt="Preview" 
                        fill 
                        className="object-contain"
                    />
                </div>
                
                {/* Visual Grid Overlay (Optional Professional Touch) */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="w-full h-1/3 border-b border-white/50 absolute top-0"></div>
                    <div className="w-full h-1/3 border-b border-white/50 absolute bottom-0"></div>
                    <div className="h-full w-1/3 border-r border-white/50 absolute left-0"></div>
                    <div className="h-full w-1/3 border-r border-white/50 absolute right-0"></div>
                </div>
            </div>

            {/* Controls */}
            <div className="w-full sm:w-56 flex flex-col gap-6">
                
                {/* 1. Presets */}
                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase text-slate-400">Crop Presets</p>
                    <div className="grid grid-cols-1 gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setPreset("square")}
                            className={`w-full justify-start text-xs border-slate-700 hover:bg-slate-800 ${preset === "square" ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700" : "text-slate-300"}`}
                        >
                            Square (1:1)
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => setPreset("landscape")}
                            className={`w-full justify-start text-xs border-slate-700 hover:bg-slate-800 ${preset === "landscape" ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700" : "text-slate-300"}`}
                        >
                            Landscape (16:9)
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => setPreset("portrait")}
                            className={`w-full justify-start text-xs border-slate-700 hover:bg-slate-800 ${preset === "portrait" ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700" : "text-slate-300"}`}
                        >
                            Portrait (4:5)
                        </Button>
                    </div>
                </div>

                {/* 2. Rotation Slider (✅ Now Used) */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-400">
                        <span className="flex items-center gap-1"><RotateCw size={12}/> Rotation</span>
                        <span className="text-white">{rotation}°</span>
                    </div>
                    
                    <Slider
                        defaultValue={[0]}
                        value={[rotation]}
                        max={360}
                        step={90} // 90 degree steps usually safer for web, can be 1 for free rotation
                        onValueChange={(val) => setRotation(val[0])}
                        className="py-2"
                    />
                    
                    <div className="flex justify-between">
                        <button onClick={() => setRotation(0)} className="text-[10px] text-slate-500 hover:text-white transition">Reset</button>
                        <button onClick={() => setRotation((prev) => (prev + 90) % 360)} className="text-[10px] text-indigo-400 hover:text-indigo-300 transition">+90°</button>
                    </div>
                </div>

                <div className="mt-auto">
                    <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                        * Original file will be kept safe. A new version will be created.
                    </p>
                </div>
            </div>
        </div>

        <DialogFooter>
            <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800">
                Cancel
            </Button>
            <Button onClick={handleSaveAsNew} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20">
                {loading ? <Loader2 className="animate-spin mr-2" size={16}/> : <Save className="mr-2" size={16}/>}
                Save New Image
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}