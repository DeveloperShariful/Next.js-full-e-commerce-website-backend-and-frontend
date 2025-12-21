//app/admin/settings/payments/_components/Payment_Gateways/Paypal/Components/Paypal_Save_Sticky_Bar.tsx

"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface PaypalSaveBarProps {
  onSave: () => void
  isPending: boolean
  disabled?: boolean
}

export const Paypal_Save_Sticky_Bar = ({ 
  onSave, 
  isPending, 
  disabled = false 
}: PaypalSaveBarProps) => {
  return (
    <div className="sticky bottom-0 -mx-6 -mb-6 mt-8 border-t bg-background p-4 flex justify-end gap-4 items-center z-10">
      <p className="text-xs text-muted-foreground mr-auto">
        PayPal updates may take a few moments to propagate.
      </p>
      
      <Button 
        onClick={onSave} 
        disabled={disabled || isPending}
        className="min-w-[120px] bg-[#0070BA] hover:bg-[#003087]"
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save PayPal Settings
      </Button>
    </div>
  )
}