//app/admin/settings/payments/_components/Payment_Gateways/Stripe/Components/Stripe_Save_Sticky_Bar.tsx

"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

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
    <div className="sticky bottom-0 -mx-6 -mb-6 mt-8 border-t bg-background p-4 flex justify-end gap-4 items-center z-10">
      <p className="text-xs text-muted-foreground mr-auto">
        Stripe settings apply immediately upon saving.
      </p>
      
      <Button 
        onClick={onSave} 
        disabled={disabled || isPending}
        className="min-w-[120px] bg-[#635BFF] hover:bg-[#5851DF]"
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Stripe Config
      </Button>
    </div>
  )
}