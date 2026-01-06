// File Location: app/admin/orders/[orderId]/_components/customer-note.tsx

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareQuote } from "lucide-react";

export const CustomerNote = ({ note }: { note: string | null }) => {
  if (!note) return null; 

  return (
    <Card className="border-amber-200 bg-amber-50 shadow-sm">
      <CardHeader className="pb-2 border-b border-amber-100">
        <CardTitle className="text-xs font-bold uppercase text-amber-700 flex items-center gap-2 tracking-wider">
          <MessageSquareQuote size={14} /> Customer Note
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-amber-900 italic leading-relaxed">
          "{note}"
        </p>
      </CardContent>
    </Card>
  );
};