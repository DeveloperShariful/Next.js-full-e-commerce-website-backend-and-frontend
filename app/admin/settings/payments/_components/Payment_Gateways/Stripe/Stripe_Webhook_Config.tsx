// app/admin/settings/payments/_components/Payment_Gateways/Stripe/Stripe_Webhook_config.tsx

"use client"

import { useState, useEffect } from "react"
import { StripeConfigType } from "@/app/admin/settings/payments/types"
import { refreshStripeWebhooks } from "@/app/actions/admin/settings/payments/stripe/refresh-webhooks"
import { deleteStripeWebhook } from "@/app/actions/admin/settings/payments/stripe/delete-webhook" // 👈 Import Delete Action
import { toast } from "sonner"
import { Stripe_Webhook_Status_Card } from "./Components/Stripe_Webhook_Status_Card"
import { Stripe_Debug_Log_Viewer } from "./Components/Stripe_Debug_Log_Viewer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface WebhookConfigProps {
  methodId: string
  config: StripeConfigType
}

export const Stripe_Webhook_Config = ({ methodId, config }: WebhookConfigProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
  const router = useRouter()

  // 👇 ক্লায়েন্ট সাইডে URL জেনারেট করা (যাতে window object পাওয়া যায়)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/webhooks/stripe`)
    }
  }, [])

  // 1. Setup / Sync Handler
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const res = await refreshStripeWebhooks(methodId)
      
      if (res.success) {
        toast.success("Webhooks synced successfully")
        // সার্ভার থেকে আসা URL সেট করা (যদি থাকে)
        if (res.webhookUrl) setWebhookUrl(res.webhookUrl)
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

  // 2. Disconnect Handler (Gap #2 Solution)
  const handleDisconnect = async () => {
    if(!confirm("Are you sure? This will stop real-time payment updates.")) return;
    
    setIsRefreshing(true)
    try {
        const res = await deleteStripeWebhook(methodId)
        if(res.success) {
            toast.success("Webhook disconnected")
            router.refresh()
        } else {
            toast.error(res.error)
        }
    } catch (error) {
        toast.error("Failed to disconnect")
    } finally {
        setIsRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Stripe_Webhook_Status_Card 
        isTestMode={!!config.testMode}
        hasLiveSecret={!!config.liveWebhookSecret}
        hasTestSecret={!!config.testWebhookSecret}
        onRefresh={handleRefresh}
        onDisconnect={handleDisconnect} // 👈 Pass disconnect handler
        isRefreshing={isRefreshing}
        webhookUrl={webhookUrl} // 👈 Pass the URL
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