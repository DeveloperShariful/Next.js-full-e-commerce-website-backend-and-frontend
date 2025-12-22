//app/admin/settings/payments/_components/Payment_Gateways/Stripe/Components/Stripe_Save_Sticky_Bar.tsx

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
    <div className="sticky bottom-0 -mx-4 md:-mx-8 -mb-4 md:-mb-8 mt-8 border-t bg-white p-4 md:p-6 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 items-center z-10 shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)]">
      <p className="text-xs text-muted-foreground mr-auto hidden sm:block">
        Stripe settings apply immediately upon saving.
      </p>
      
      <Button 
        onClick={onSave} 
        disabled={disabled || isPending}
        className={cn(
          "w-full sm:w-auto min-w-[140px] transition-all",
          "bg-[#635BFF] hover:bg-[#5851DF] text-white font-medium"
        )}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}