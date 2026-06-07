//File Path: app/(backend)/admin/marketing/merchant-center/_components/TabAttributes.tsx

"use client";

// আমরা আগের ধাপে বানানো কম্পোনেন্টটি রিইউজ করছি
import Step3AttributeMapping from "./Step3AttributeMapping";

export default function TabAttributes() {
  return (
    <div className="max-w-[1200px] mx-auto mt-6">
      
      {/* Header Info */}
      <div className="mb-6">
        <h2 className="text-[20px] font-normal text-[#1d2327] m-0 mb-1">Attribute Mapping</h2>
        <p className="text-[13px] text-[#646970] m-0 max-w-[800px]">
          Google requires specific attributes like color, size, and category to properly list your items. 
          Use this section to map your store's attributes to Google's standard attributes.
        </p>
      </div>

      {/* 🚀 The Magic: Reusing our Wizard Component */}
      <div className="bg-white border border-[#ccd0d4] rounded-[3px] overflow-hidden">
        <Step3AttributeMapping />
      </div>

    </div>
  );
}