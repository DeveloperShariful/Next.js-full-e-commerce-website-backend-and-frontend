// app/admin/settings/payments/_components/Payment_Gateways/Paypal/Paypal_Webhook_Tab.tsx
"use client"

import { useState } from "react"
import { Paypal_Webhook_Status_Card } from "./Components/Paypal_Webhook_Status_Card"
import { refreshPaypalWebhook } from "@/app/actions/settings/payments/paypal/refresh-webhooks"
import { PaypalConfigType } from "@/app/admin/settings/payments/types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Webhook } from "lucide-react"

interface WebhookTabProps {
  methodId: string
  config: PaypalConfigType
}

export const Paypal_Webhook_Tab = ({ methodId, config }: WebhookTabProps) => {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // কানেকশন আছে কি না চেক করা
  const isConnected = config.sandbox 
    ? (!!config.sandboxClientId && !!config.sandboxClientSecret)
    : (!!config.liveClientId && !!config.liveClientSecret)

  const handleRefresh = async () => {
    setLoading(true)
    const res = await refreshPaypalWebhook(methodId)
    
    if (res.success) {
      toast.success("Webhook configured successfully!")
      router.refresh()
    } else {
      toast.error(res.error || "Failed to configure webhook")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-[#003087]" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            Manage automatic notifications from PayPal to your store (e.g., Payment success, Refunds).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Connection Required</AlertTitle>
              <AlertDescription>
                Please connect your PayPal account in the <strong>Connection</strong> tab before configuring webhooks.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Paypal_Webhook_Status_Card 
                webhookId={config.webhookId}
                isSandbox={!!config.sandbox}
                onRefresh={handleRefresh}
                isRefreshing={loading}
              />
              
              <div className="mt-4 text-sm text-muted-foreground bg-muted/30 p-4 rounded-md border border-dashed">
                <p className="font-medium text-gray-700 mb-1">Why do I need this?</p>
                <p>
                  Webhooks ensure your orders are marked as "Paid" even if the customer closes their browser immediately after payment. 
                  It acts as a reliable communication line between PayPal server and your store.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}