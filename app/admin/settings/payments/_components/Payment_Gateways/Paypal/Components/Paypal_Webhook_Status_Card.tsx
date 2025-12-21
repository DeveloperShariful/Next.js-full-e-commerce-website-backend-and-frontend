//app/admin/settings/payments/_components/Payment_Gateways/Paypal/Components/Paypal_Webhook_Status_Card.tsx

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaypalWebhookProps {
  isSandbox: boolean // PayPal uses "Sandbox" instead of "Test Mode"
  webhookId: string | null
  onRefresh: () => void
  isRefreshing: boolean
}

export const Paypal_Webhook_Status_Card = ({
  isSandbox,
  webhookId,
  onRefresh,
  isRefreshing
}: PaypalWebhookProps) => {
  const isActive = !!webhookId

  return (
    <Card className="border-l-4 border-l-[#0070BA]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">PayPal Webhooks</CardTitle>
          <CardDescription>
            Receives payment confirmations from PayPal.
          </CardDescription>
        </div>
        <Badge variant={isActive ? "default" : "destructive"} className="ml-auto">
          {isActive ? "Active" : "Not Set"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
          <div className="flex items-center gap-2">
            {isActive ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {isSandbox ? "Sandbox" : "Live"} Listener
            </span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            {isActive ? "Check Status" : "Create Webhook"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}