"use client"

import { useState } from "react"
import { StripeConfigType } from "@/app/admin/settings/payments/types"
import { refreshStripeWebhooks } from "@/app/actions/settings/payments/stripe/refresh-webhooks"
import { toast } from "sonner"
import { Stripe_Webhook_Status_Card } from "./Components/Stripe_Webhook_Status_Card"
import { Stripe_Debug_Log_Viewer } from "./Components/Stripe_Debug_Log_Viewer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
// 👇 Change 1: Import useRouter
import { useRouter } from "next/navigation"

interface WebhookConfigProps {
  methodId: string
  config: StripeConfigType
}

export const Stripe_Webhook_Config = ({ methodId, config }: WebhookConfigProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  // 👇 Change 2: Initialize router
  const router = useRouter()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const res = await refreshStripeWebhooks(methodId)
      
      if (res.success) {
        toast.success("Webhooks updated successfully")
        // 👇 Change 3: Force refresh the page data
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Stripe_Webhook_Status_Card 
        isTestMode={!!config.testMode}
        // These checks depend on the props being refreshed
        hasLiveSecret={!!config.liveWebhookSecret}
        hasTestSecret={!!config.testWebhookSecret}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <Card>
        <CardHeader>
          <CardTitle>Stripe Event Logs</CardTitle>
          <CardDescription>
            Recent communication between Stripe and your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Stripe_Debug_Log_Viewer />
        </CardContent>
      </Card>
    </div>
  )
}