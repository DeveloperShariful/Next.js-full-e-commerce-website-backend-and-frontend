//app/admin/settings/payments/_components/Payment_Gateways/Stripe/Components/Stripe_Connect_Button.tsx

"use client"

import { Button } from "@/components/ui/button"
import { Loader2, Link, Unlink } from "lucide-react"
import { cn } from "@/lib/utils"

interface StripeConnectButtonProps {
  isConnected: boolean
  isLoading?: boolean
  onClick: () => void
}

export const Stripe_Connect_Button = ({ 
  isConnected, 
  isLoading, 
  onClick 
}: StripeConnectButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      variant={isConnected ? "destructive" : "default"}
      className={cn(
        "w-full sm:w-auto gap-2 font-medium transition-all",
        // Stripe Brand Color: #635BFF
        !isConnected && "bg-[#635BFF] hover:bg-[#5851DF] text-white"
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isConnected ? (
        <>
          <Unlink className="h-4 w-4" />
          Disconnect Stripe
        </>
      ) : (
        <>
          <Link className="h-4 w-4" />
          Connect with Stripe
        </>
      )}
    </Button>
  )
}