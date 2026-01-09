// app/admin/settings/payments/_components/Payment_Gateways/Stripe/Components/Stripe_Save_Sticky_Bar.tsx

"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface StripeSaveBarProps {
  onSave: () => void
  isPending: boolean
  disabled?: boolean
}

export const Stripe_Save_Sticky_Bar = ({ 
  onSave, 
  isPending, 
  disabled = false 
}: StripeSaveBarProps) => {
  return (
    // ✅ FIX 1: z-index 9999 (যাতে সবার উপরে থাকে)
    <div className="sticky bottom-0 left-0 right-0 py-4 px-6 bg-white border-t border-gray-200 flex justify-end items-center gap-4 z-[9999] shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
      
      <p className="text-xs text-muted-foreground mr-auto hidden sm:block font-medium">
        ⚠️ Don't forget to save your changes.
      </p>
      
      <Button 
        type="button"
        // ✅ FIX 2: onClick ইভেন্টটি সরাসরি এবং কনসোল লগ সহ
        onClick={(e) => {
            e.preventDefault();
            console.log("🟢 Save button clicked!"); // কনসোলে চেক করার জন্য
            onSave();
        }} 
        disabled={disabled || isPending}
        className={cn(
          "min-w-[140px] font-bold shadow-md transition-all active:scale-95",
          "bg-[#635BFF] hover:bg-[#5851DF] text-white"
        )}
      >
        {isPending ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
        ) : (
            "Save Changes"
        )}
      </Button>
    </div>
  )
}