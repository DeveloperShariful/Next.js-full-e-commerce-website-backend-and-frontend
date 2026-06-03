// File: app/(backend)/admin/settings/_components/email/branding-preview.tsx

"use client";

interface BrandingPreviewProps {
  logo?: string;
  baseColor: string;
  bgColor: string;
  bodyColor: string;
  footerText: string;
}

export const BrandingPreview = ({ logo, baseColor, bgColor, bodyColor, footerText }: BrandingPreviewProps) => {
  return (
    // WP Postbox / Meta box style
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] box-border lg:sticky lg:top-6 w-full">
      <h2 className="text-[14px] font-semibold text-[#1d2327] m-0 px-[12px] py-[8px] border-b border-[#c3c4c7]">
        Live Email Preview
      </h2>
      
      <div className="p-[12px] w-full box-border overflow-x-auto">
        {/* Email Container (Simulating the Email HTML) */}
        <div 
            className="border border-[#c3c4c7] rounded-[3px] text-[13px] min-w-[280px]"
            style={{ backgroundColor: bgColor || "#f7f7f7", padding: "15px" }}
        >
            {/* Email Body */}
            <div 
                className="max-w-[300px] w-full mx-auto rounded shadow-sm overflow-hidden border border-[#dcdcde]"
                style={{ backgroundColor: bodyColor || "#ffffff" }}
            >
                {/* Header / Logo */}
                <div className="p-[15px] text-center border-b border-[#f0f0f1]">
                    {logo ? (
                        <img src={logo} alt="Logo" className="max-h-[30px] max-w-full mx-auto object-contain" />
                    ) : (
                        <span className="font-bold text-[#c3c4c7]">STORE LOGO</span>
                    )}
                </div>

                {/* Content */}
                <div className="p-[20px] space-y-[12px]">
                    <h2 className="text-[16px] font-bold m-0" style={{ color: baseColor || "#2271b1" }}>
                        Hello Customer,
                    </h2>
                    <p className="text-[#3c434a] text-[13px] leading-relaxed m-0">
                        This is a sample text to show how your emails will look. 
                        Your order <strong className="text-[#1d2327]">#1001</strong> has been placed.
                    </p>
                    
                    {/* Primary Button */}
                    <div className="pt-[10px] text-center">
                        <span 
                            className="inline-block text-white px-[15px] py-[8px] rounded-[3px] text-[13px] font-bold"
                            style={{ backgroundColor: baseColor || "#2271b1" }}
                        >
                            View Order
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-[#f6f7f7] p-[12px] text-center border-t border-[#f0f0f1]">
                    <p className="text-[11px] text-[#646970] m-0">
                        {footerText || "© Store. All rights reserved."}
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};