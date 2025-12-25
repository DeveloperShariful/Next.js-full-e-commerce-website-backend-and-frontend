// components/ui/image-upload.tsx

"use client";

import { useEffect, useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  value: string[];
  showPreview?: boolean; // 🔥 NEW PROP: To control preview visibility
}

export default function ImageUpload({
  disabled,
  onChange,
  onRemove,
  value,
  showPreview = true // Default is true
}: ImageUploadProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onUpload = (result: any) => {
    onChange(result.info.secure_url);
  };

  if (!isMounted) return null;

  return (
    <div>
      {/* 🔥 CONDITIONALLY RENDER PREVIEW */}
      {showPreview && (
        <div className="mb-4 flex items-center gap-4 flex-wrap">
          {value.map((url, index) => (
            <div key={url + index} className="relative w-[100px] h-[100px] rounded-md overflow-hidden border border-gray-200 group">
              <div className="z-10 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                <button 
                  type="button" 
                  onClick={() => onRemove(url)} 
                  className="bg-red-500 text-white p-1 rounded-full shadow-sm hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
              <Image 
                fill 
                className="object-cover" 
                alt="Image" 
                src={url} 
              />
            </div>
          ))}
        </div>
      )}
      
      <CldUploadWidget 
        onSuccess={onUpload} 
        uploadPreset="my_shop_preset" 
        options={{
          multiple: true,
          maxFiles: 15
        }}
      >
        {({ open }) => {
          const handleOnClick = () => {
            open();
          }
          return (
            <button
              type="button"
              disabled={disabled}
              onClick={handleOnClick}
              className="flex items-center justify-center gap-2 bg-slate-100 border border-slate-300 w-full p-8 rounded-lg text-slate-600 hover:bg-slate-200 transition border-dashed"
            >
              <ImagePlus size={30} />
              <span className="font-medium">Upload Images</span>
            </button>
          );
        }}
      </CldUploadWidget>
    </div>
  );
}