//app/admin/settings/payments/_components/Payment_Gateways/Paypal/Components/Paypal_Save_Sticky_Bar.tsx

"use client"

"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaypalSaveBarProps {
  onSave: () => void
  isPending: boolean
}

export const Paypal_Save_Sticky_Bar = ({ onSave, isPending }: PaypalSaveBarProps) => {
  return (
    <div className="sticky bottom-0 -mx-4 md:-mx-6 -mb-4 md:-mb-6 mt-8 border-t bg-white p-4 md:p-6 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 items-center z-10 shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)]">
      <p className="text-xs text-muted-foreground mr-auto hidden sm:block">
        Changes will be reflected on your checkout immediately.
      </p>
      <Button 
        type="button" 
        onClick={onSave}
        disabled={isPending}
        className={cn(
          "w-full sm:w-auto min-w-[140px]",
          "bg-[#003087] hover:bg-[#001c64] text-white"
        )}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Saving..." : "Save Configuration"}
      </Button>
    </div>
  )
}