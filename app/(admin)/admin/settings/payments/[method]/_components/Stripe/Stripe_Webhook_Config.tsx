// app/admin/settings/payments/_components/Stripe/Stripe_Webhook_config.tsx

"use client"

import { useState, useEffect } from "react"
import { StripeConfigType } from "@/app/(admin)/admin/settings/payments/types"
import { refreshStripeWebhooks, deleteStripeWebhook } from "@/app/actions/admin/settings/payments/stripe/refresh-delete-webhook"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle2, XCircle, Globe, Link as LinkIcon, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface WebhookConfigProps {
  methodId: string
  config: StripeConfigType
}

export const Stripe_Webhook_Config = ({ methodId, config }: WebhookConfigProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
  const router = useRouter()
  
  const isTestMode = !!config.testMode
  const isActive = isTestMode ? !!config.testWebhookSecret : !!config.liveWebhookSecret

  useEffect(() => {
    if (typeof window !== "undefined") setWebhookUrl(`${window.location.origin}/api/webhooks/stripe`)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const res = await refreshStripeWebhooks(methodId)
      if (res.success) {
        toast.success("Webhooks synced successfully")
        if (res.webhookUrl) setWebhookUrl(res.webhookUrl)
        router.refresh()
      } else toast.error(res.error)
    } catch (error) { toast.error("Something went wrong") } finally { setIsRefreshing(false) }
  }

  const handleDisconnect = async () => {
    if(!confirm("Are you sure? This will stop real-time payment updates.")) return;
    setIsRefreshing(true)
    try {
        const res = await deleteStripeWebhook(methodId)
        if(res.success) { toast.success("Webhook disconnected"); router.refresh() } 
        else toast.error(res.error)
    } catch (error) { toast.error("Failed to disconnect") } finally { setIsRefreshing(false) }
  }

  return (
    <Card className={cn("border-l-4 transition-all", isActive ? "border-l-[#635BFF]" : "border-l-yellow-500")}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">Stripe Webhooks</CardTitle>
          <CardDescription>Ensures Stripe can notify your store about payments.</CardDescription>
        </div>
        <Badge variant={isActive ? "default" : "destructive"} className={cn("w-fit", isActive ? "bg-[#635BFF]" : "bg-yellow-100 text-yellow-800")}>
          {isActive ? "Active" : "Not Connected"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/30 p-3 rounded-md border gap-3">
          <div className="flex items-center gap-2">
            {isActive ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-yellow-500" />}
            <span className="text-sm font-medium">{isTestMode ? "Test" : "Live"} Environment</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             {isActive && (
               <Button variant="destructive" size="sm" onClick={handleDisconnect} disabled={isRefreshing} className="h-9 sm:h-8">
                   <Trash2 className="h-3.5 w-3.5 mr-2" /> Disconnect
               </Button>
             )}
             <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2 h-9 sm:h-8">
               <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} /> {isActive ? "Sync & Repair" : "Setup Webhooks"}
             </Button>
          </div>
        </div>
        {isActive && webhookUrl && (
            <div className="space-y-1.5 overflow-hidden">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><LinkIcon className="h-3 w-3" /> Connected Endpoint:</p>
                <div className="flex items-center gap-2 p-2 bg-slate-950 text-slate-200 rounded-md font-mono text-xs break-all">
                    <Globe className="h-3.5 w-3.5 flex-shrink-0 text-[#635BFF]" /><span className="break-all">{webhookUrl}</span>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  )
}