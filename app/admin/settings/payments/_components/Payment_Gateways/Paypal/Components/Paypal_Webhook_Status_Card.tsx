//app/admin/settings/payments/_components/Payment_Gateways/Paypal/Components/Paypal_Webhook_Status_Card.tsx

"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle2, XCircle, Globe, Link as LinkIcon, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaypalWebhookProps {
  isSandbox: boolean
  webhookId: string | null
  webhookUrl: string | null
  onRefresh: () => void
  onDelete: () => void // 👈 New Prop
  isRefreshing: boolean
  isDeleting: boolean  // 👈 New Prop
}

export const Paypal_Webhook_Status_Card = ({
  isSandbox,
  webhookId,
  webhookUrl,
  onRefresh,
  onDelete,
  isRefreshing,
  isDeleting
}: PaypalWebhookProps) => {
  const isActive = !!webhookId

  return (
    <Card className={cn("border-l-4", isActive ? "border-l-green-600" : "border-l-yellow-500")}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            PayPal Webhook Listener
          </CardTitle>
          <CardDescription>
            Receives real-time updates for payments and refunds.
          </CardDescription>
        </div>
        <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-600 hover:bg-green-700" : ""}>
          {isActive ? "Active" : "Not Set"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Status Bar & Actions */}
        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-md border">
          <div className="flex items-center gap-2">
            {isActive ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-yellow-500" />
            )}
            <span className="text-sm font-medium">
              {isSandbox ? "Sandbox" : "Live"} Environment
            </span>
          </div>
          
          <div className="flex gap-2">
            {/* Delete Button (Only shows if Active) */}
            {isActive && (
                <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={onDelete}
                    disabled={isDeleting || isRefreshing}
                    className="h-8"
                >
                    {isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-2" />}
                    Disconnect
                </Button>
            )}

            {/* Sync/Create Button */}
            <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                disabled={isRefreshing || isDeleting}
                className="gap-2 h-8"
            >
                <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                {isActive ? "Sync & Repair" : "Create Webhook"}
            </Button>
          </div>
        </div>

        {/* URL Display */}
        {isActive && webhookUrl && (
            <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" /> Connected Endpoint:
                </p>
                <div className="flex items-center gap-2 p-2 bg-slate-950 text-slate-200 rounded-md font-mono text-xs break-all">
                    <Globe className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
                    {webhookUrl}
                </div>
            </div>
        )}

      </CardContent>
    </Card>
  )
}