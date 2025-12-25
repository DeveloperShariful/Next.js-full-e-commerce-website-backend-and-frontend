// File Location: app/admin/orders/[orderId]/invoice/_components/print-button.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export const PrintButton = () => {
  return (
    <Button 
      onClick={() => window.print()} 
      className="bg-slate-900 text-white hover:bg-slate-800 gap-2 print:hidden"
    >
      <Printer size={16} /> Print Invoice
    </Button>
  );
};