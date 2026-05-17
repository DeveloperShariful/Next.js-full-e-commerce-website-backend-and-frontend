// File Location: app/admin/orders/[orderId]/invoice/_components/invoice-actions.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Printer, Link as LinkIcon, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface InvoiceActionsProps {
  orderId: string;
}

export const InvoiceActions = ({ orderId }: InvoiceActionsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    // কাস্টমারের পেমেন্ট লিংক তৈরি করা হচ্ছে
    const link = `${window.location.origin}/checkout/pay/${orderId}`;
    
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Payment link copied to clipboard!");

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto print:hidden">
      {/* Copy Link Button */}
      <Button 
        variant="outline" 
        onClick={handleCopyLink}
        className="gap-2 bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
      >
        {copied ? <Check size={16} className="text-green-600"/> : <LinkIcon size={16}/>}
        {copied ? "Copied" : "Copy Payment Link"}
      </Button>

      {/* Print Button */}
      <Button 
        onClick={() => window.print()} 
        className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
      >
        <Printer size={16} /> Print Invoice
      </Button>
    </div>
  );
};