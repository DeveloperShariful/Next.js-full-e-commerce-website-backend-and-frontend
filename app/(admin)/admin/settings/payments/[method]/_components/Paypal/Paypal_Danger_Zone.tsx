// app/admin/settings/payments/_components/Paypal/Paypal_Danger_Zone.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"
import { clearPaypalSettings } from "@/app/actions/admin/settings/payments/paypal/disconnect-paypal"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface DangerZoneProps {
  methodId: string
}

export const Paypal_Danger_Zone = ({ methodId }: DangerZoneProps) => {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const handleReset = async () => {
    if (!confirm("Are you sure? This will delete all PayPal credentials and connection data. This action cannot be undone.")) {
      return
    }

    setIsPending(true)
    const res = await clearPaypalSettings(methodId)
    
    if (res.success) {
      toast.success("PayPal settings reset to default")
      router.refresh()
    } else {
      toast.error(res.error)
    }
    setIsPending(false)
  }

  return (
    <Card className="border-red-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <CardTitle>Danger Zone</CardTitle>
        </div>
        <CardDescription>
          Irreversible actions for your PayPal configuration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-red-100 bg-red-50 rounded-lg">
          <div className="space-y-1">
            <h4 className="font-medium text-red-900">Reset Configuration</h4>
            <p className="text-sm text-red-700">
              Disconnects PayPal, removes all API keys, and disables the payment method.
            </p>
          </div>
          <Button 
            variant="destructive" 
            onClick={handleReset}
            disabled={isPending}
            className="w-full sm:w-auto shrink-0"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset PayPal
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}