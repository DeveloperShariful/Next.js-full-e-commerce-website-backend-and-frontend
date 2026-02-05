// app/admin/settings/payments/_components/Paypal/Paypal_Webhook_Tab.tsx
"use client"

import { useState } from "react"
import { refreshPaypalWebhook, deletePaypalWebhook } from "@/app/actions/admin/settings/payments/paypal/refresh-delete-webhook"
import { PaypalConfigType } from "@/app/(admin)/admin/settings/payments/types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Webhook, RefreshCw, CheckCircle2, XCircle, Globe, Link as LinkIcon, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

// ==========================================
// INTERNAL SUB-COMPONENT: STATUS CARD
// ==========================================

interface PaypalWebhookCardProps {
  isSandbox: boolean
  webhookId: string | null
  webhookUrl: string | null
  onRefresh: () => void
  onDelete: () => void
  isRefreshing: boolean
  isDeleting: boolean
}

const PaypalWebhookStatusCard = ({
  isSandbox,
  webhookId,
  webhookUrl,
  onRefresh,
  onDelete,
  isRefreshing,
  isDeleting
}: PaypalWebhookCardProps) => {
  const isActive = !!webhookId

  return (
    <Card className={cn("border-l-4 transition-all", isActive ? "border-l-green-600" : "border-l-yellow-500")}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            PayPal Webhook Listener
          </CardTitle>
          <CardDescription>
            Receives real-time updates for payments and refunds.
          </CardDescription>
        </div>
        <Badge variant={isActive ? "default" : "secondary"} className={cn("w-fit", isActive ? "bg-green-600 hover:bg-green-700" : "")}>
          {isActive ? "Active" : "Not Set"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/30 p-3 rounded-md border gap-3">
          <div className="flex items-center gap-2">
            {isActive ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">
              {isSandbox ? "Sandbox" : "Live"} Environment
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {isActive && (
                <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={onDelete}
                    disabled={isDeleting || isRefreshing}
                    className="h-9 sm:h-8 w-full sm:w-auto"
                >
                    {isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-2" />}
                    Disconnect
                </Button>
            )}

            <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                disabled={isRefreshing || isDeleting}
                className="gap-2 h-9 sm:h-8 w-full sm:w-auto"
            >
                <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                {isActive ? "Sync & Repair" : "Create Webhook"}
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
                    <Globe className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
                    <span className="break-all">{webhookUrl}</span>
                </div>
            </div>
        )}

      </CardContent>
    </Card>
  )
}

// ==========================================
// MAIN COMPONENT: WEBHOOK TAB
// ==========================================

interface WebhookTabProps {
  methodId: string
  config: PaypalConfigType
}

export const Paypal_Webhook_Tab = ({ methodId, config }: WebhookTabProps) => {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false) 
  const [currentWebhookUrl, setCurrentWebhookUrl] = useState(config.webhookUrl)
  const router = useRouter() 
  const isConnected = config.sandbox 
    ? (!!config.sandboxClientId && !!config.sandboxClientSecret)
    : (!!config.liveClientId && !!config.liveClientSecret)

  const handleRefresh = async () => {
    setLoading(true)
    const res = await refreshPaypalWebhook(methodId)
    
    if (res.success) {
      toast.success("Webhook synced successfully!")
      if (res.webhookUrl) setCurrentWebhookUrl(res.webhookUrl)
      router.refresh()
    } else {
      toast.error(res.error || "Failed to sync webhook")
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if(!confirm("Are you sure you want to delete this webhook? It will stop automatic payment updates.")) return;
    
    setDeleting(true)
    const res = await deletePaypalWebhook(methodId)

    if(res.success) {
        toast.success("Webhook disconnected")
        setCurrentWebhookUrl(null)
        router.refresh()
    } else {
        toast.error(res.error || "Failed to disconnect")
    }
    setDeleting(false)
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
            Manage automatic notifications from PayPal to your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Connection Required</AlertTitle>
              <AlertDescription>
                Please connect your PayPal account in the <strong>Connection</strong> tab first.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <PaypalWebhookStatusCard 
                webhookId={config.webhookId}
                webhookUrl={currentWebhookUrl}
                isSandbox={!!config.sandbox}
                onRefresh={handleRefresh}
                onDelete={handleDelete} 
                isRefreshing={loading}
                isDeleting={deleting}  
              />
              
              <div className="mt-4 text-sm text-muted-foreground bg-muted/30 p-4 rounded-md border border-dashed">
                <p className="font-medium text-gray-700 mb-1">Why do I need this?</p>
                <p>
                  Webhooks ensure your orders are marked as "Paid" even if the customer closes their browser immediately after payment.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}