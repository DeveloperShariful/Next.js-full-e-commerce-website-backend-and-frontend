// File: app/admin/settings/email/_components/branding-preview.tsx

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BrandingPreviewProps {
  logo?: string;
  baseColor: string;
  bgColor: string;
  bodyColor: string;
  footerText: string;
}

export const BrandingPreview = ({ logo, baseColor, bgColor, bodyColor, footerText }: BrandingPreviewProps) => {
  return (
    <Card className="sticky top-6 border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-bold uppercase text-slate-500">Live Email Preview</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Email Container (Simulating the Email HTML) */}
        <div 
            className="border rounded-md overflow-hidden text-sm"
            style={{ backgroundColor: bgColor || "#f7f7f7", padding: "20px" }}
        >
            {/* Email Body */}
            <div 
                className="max-w-[300px] mx-auto rounded shadow-sm overflow-hidden"
                style={{ backgroundColor: bodyColor || "#ffffff" }}
            >
                {/* Header / Logo */}
                <div className="p-4 text-center border-b border-slate-100">
                    {logo ? (
                        <img src={logo} alt="Logo" className="h-8 mx-auto object-contain" />
                    ) : (
                        <span className="font-bold text-slate-300">STORE LOGO</span>
                    )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                    <h2 className="text-lg font-bold" style={{ color: baseColor || "#2271b1" }}>
                        Hello Customer,
                    </h2>
                    <p className="text-slate-600 text-xs leading-relaxed">
                        This is a sample text to show how your emails will look to customers. 
                        Your order <strong>#1001</strong> has been successfully placed.
                    </p>
                    
                    {/* Primary Button */}
                    <div className="py-2 text-center">
                        <span 
                            className="inline-block text-white px-4 py-2 rounded text-xs font-bold"
                            style={{ backgroundColor: baseColor || "#2271b1" }}
                        >
                            View Order
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-3 text-center">
                    <p className="text-[10px] text-slate-400">
                        {footerText || "© 2025 Store Name. All rights reserved."}
                    </p>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};