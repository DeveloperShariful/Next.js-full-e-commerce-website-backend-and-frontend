"use client";

import { useEffect, useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus, Trash, X } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  value: string[];
}

export default function ImageUpload({
  disabled,
  onChange,
  onRemove,
  value
}: ImageUploadProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onUpload = (result: any) => {
    // প্রতিটি ছবি আপলোড হওয়ার সাথে সাথে প্যারেন্টকে পাঠানো হচ্ছে
    onChange(result.info.secure_url);
  };

  if (!isMounted) return null;

  return (
    <div>
      {/* ইমেজের প্রিভিউ এরিয়া */}
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        {value.map((url, index) => (
          <div key={url + index} className="relative w-[150px] h-[150px] rounded-md overflow-hidden border border-gray-200 group">
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
      
      {/* Cloudinary বাটন */}
      <CldUploadWidget 
        onSuccess={onUpload} 
        uploadPreset="my_shop_preset" // আপনার প্রিসেট নাম চেক করুন
        options={{
          multiple: true, // ✅ এই লাইনটি ৮-১০ টা ছবি একসাথে আপলোড করতে দিবে
          maxFiles: 10
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