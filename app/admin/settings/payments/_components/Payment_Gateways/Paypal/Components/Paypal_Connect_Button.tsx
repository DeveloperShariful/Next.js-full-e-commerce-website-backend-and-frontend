//app/admin/settings/payments/_components/Payment_Gateways/Paypal/Components/Paypal_Connect_Button.tsx

"use client"

import { Button } from "@/components/ui/button"
import { Loader2, Link, Unlink } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaypalConnectButtonProps {
  isConnected: boolean
  isLoading?: boolean
  onClick: () => void
}

export const Paypal_Connect_Button = ({ 
  isConnected, 
  isLoading, 
  onClick 
}: PaypalConnectButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      variant={isConnected ? "destructive" : "default"}
      className={cn(
        "w-full sm:w-auto gap-2 font-medium transition-all",
        // PayPal Brand Color: #0070BA (Blue)
        !isConnected && "bg-[#0070BA] hover:bg-[#003087] text-white"
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isConnected ? (
        <>
          <Unlink className="h-4 w-4" />
          Disconnect PayPal
        </>
      ) : (
        <>
          <Link className="h-4 w-4" />
          Connect with PayPal
        </>
      )}
    </Button>
  )
}