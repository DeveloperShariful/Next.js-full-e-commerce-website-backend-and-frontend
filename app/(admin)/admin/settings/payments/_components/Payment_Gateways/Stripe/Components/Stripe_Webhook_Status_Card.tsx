// app/admin/settings/payments/_components/Payment_Gateways/Stripe/Components/Stripe_Webhook_Status_Card.tsx

"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle2, XCircle, Globe, Link as LinkIcon, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface StripeWebhookProps {
  isTestMode: boolean
  hasLiveSecret: boolean
  hasTestSecret: boolean
  onRefresh: () => void
  onDisconnect: () => void
  isRefreshing: boolean
  webhookUrl?: string | null
}

export const Stripe_Webhook_Status_Card = ({
  isTestMode,
  hasLiveSecret,
  hasTestSecret,
  onRefresh,
  onDisconnect,
  isRefreshing,
  webhookUrl
}: StripeWebhookProps) => {
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