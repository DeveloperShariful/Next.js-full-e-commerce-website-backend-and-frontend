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

// ==========================================
// INTERNAL SUB-COMPONENT: STATUS CARD
// ==========================================

interface StripeWebhookCardProps {
  isTestMode: boolean
  hasLiveSecret: boolean
  hasTestSecret: boolean
  onRefresh: () => void
  onDisconnect: () => void
  isRefreshing: boolean
  webhookUrl?: string | null
}

const StripeWebhookStatusCard = ({
  isTestMode,
  hasLiveSecret,
  hasTestSecret,
  onRefresh,
  onDisconnect,
  isRefreshing,
  webhookUrl
}: StripeWebhookCardProps) => {
  const isActive = isTestMode ? hasTestSecret : hasLiveSecret

  return (
    <Card className={cn("border-l-4 transition-all", isActive ? "border-l-[#635BFF]" : "border-l-yellow-500")}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            Stripe Webhooks
          </CardTitle>
          <CardDescription>
            Ensures Stripe can notify your store about payments.
          </CardDescription>
        </div>
        <Badge variant={isActive ? "default" : "destructive"} className={cn("w-fit", isActive ? "bg-[#635BFF] hover:bg-[#5851DF]" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200")}>
          {isActive ? "Active" : "Not Connected"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/30 p-3 rounded-md border gap-3">
          <div className="flex items-center gap-2">
            {isActive ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">
              {isTestMode ? "Test" : "Live"} Environment
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             {isActive && (
               <Button 
                   variant="destructive" 
                   size="sm" 
                   onClick={onDisconnect}
                   disabled={isRefreshing}
                   className="h-9 sm:h-8 w-full sm:w-auto"
               >
                   <Trash2 className="h-3.5 w-3.5 mr-2" />
                   Disconnect
               </Button>
             )}

             <Button 
               variant="outline" 
               size="sm" 
               onClick={onRefresh}
               disabled={isRefreshing}
               className="gap-2 h-9 sm:h-8 w-full sm:w-auto"
             >
               <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
               {isActive ? "Sync & Repair" : "Setup Webhooks"}
             </Button>
          </div>
        </div>

        {/* URL Display */}
        {isActive && webhookUrl && (
            <div className="space-y-1.5 overflow-hidden">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" /> Connected Endpoint:
                </p>
                <div className="flex items-center gap-2 p-2 bg-slate-950 text-slate-200 rounded-md font-mono text-xs break-all">
                    <Globe className="h-3.5 w-3.5 flex-shrink-0 text-[#635BFF]" />
                    <span className="break-all">{webhookUrl}</span>
                </div>
            </div>
        )}

      </CardContent>
    </Card>
  )
}

// ==========================================
// MAIN COMPONENT: WEBHOOK CONFIG
// ==========================================

interface WebhookConfigProps {
  methodId: string
  config: StripeConfigType
}

export const Stripe_Webhook_Config = ({ methodId, config }: WebhookConfigProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
  const router = useRouter()

  // 👇 ক্লায়েন্ট সাইডে URL জেনারেট করা (যাতে window object পাওয়া যায়)
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

  // 2. Disconnect Handler
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
      <StripeWebhookStatusCard 
        isTestMode={!!config.testMode}
        hasLiveSecret={!!config.liveWebhookSecret}
        hasTestSecret={!!config.testWebhookSecret}
        onRefresh={handleRefresh}
        onDisconnect={handleDisconnect}
        isRefreshing={isRefreshing}
        webhookUrl={webhookUrl}
      />
    </div>
  )
}