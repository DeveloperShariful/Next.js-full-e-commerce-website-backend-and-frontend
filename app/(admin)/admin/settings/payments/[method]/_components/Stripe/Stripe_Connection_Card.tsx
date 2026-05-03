// app/admin/settings/payments/_components/Stripe/Stripe_Connection_card.tsx

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, User, RefreshCw, AlertCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StripeConfigType } from "@/app/(admin)/admin/settings/payments/types"
import { toast } from "sonner"
import { testStripeConnection } from "@/app/actions/admin/settings/payments/stripe/test-connection"
import { disconnectStripe } from "@/app/actions/admin/settings/payments/stripe/disconnect-stripe" 
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface ConnectionCardProps {
  config: StripeConfigType
  methodId: string
}

export const Stripe_Connection_Card = ({ config, methodId }: ConnectionCardProps) => {
  const [testing, setTesting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [accountData, setAccountData] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connected" | "error">("idle")
  const router = useRouter()

  const hasKeys = config.testMode ? !!config.testSecretKey : !!config.liveSecretKey;
  const isConfigured = config.isConnected || hasKeys;

  const checkConnection = async (isAuto = false) => {
    if (!isConfigured) {
        setLoading(false);
        return;
    }
    setTesting(true)
    if(!isAuto) setLoading(true)
    
    const res = await testStripeConnection(methodId)
    
    if (res.success) {
      if (!isAuto) toast.success("Connection Verified Successfully!")
      setAccountData(res.data)
      setConnectionStatus("connected")
    } else {
      if (!isAuto) toast.error("Connection Failed", { description: res.error })
      setAccountData(null)
      setConnectionStatus("error")
    }
    setTesting(false)
    setLoading(false)
  }

  // 👇 New Disconnect Logic
  const handleDisconnect = async () => {
    if(!confirm("Are you sure? This will delete all Stripe keys from the database.")) return;
    
    setDisconnecting(true);
    const res = await disconnectStripe(methodId);
    
    if (res.success) {
        toast.success(res.message);
        setAccountData(null);
        setConnectionStatus("idle");
        router.refresh();
    } else {
        toast.error(res.error || "Failed to disconnect");
    }
    setDisconnecting(false);
  }

  useEffect(() => {
    if (isConfigured) checkConnection(true);
    else setLoading(false);
  }, [config.testMode, methodId, isConfigured]); // Added isConfigured dependency

  const getBadge = () => {
    if (!isConfigured) return <Badge variant="destructive" className="w-fit">Not Configured</Badge>;
    if (loading) return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 w-fit">Checking...</Badge>;
    if (connectionStatus === "connected") return <Badge className="bg-green-600 hover:bg-green-700 w-fit">Connected</Badge>;
    if (connectionStatus === "error") return <Badge variant="destructive" className="w-fit">Error</Badge>;
    return <Badge variant="secondary" className="w-fit">Keys Saved</Badge>;
  }

  return (
    <Card className={cn(
        "border-l-4 transition-all duration-300",
        connectionStatus === "connected" ? "border-l-green-500 shadow-sm" : 
        connectionStatus === "error" ? "border-l-red-500" : "border-l-slate-300"
    )}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="space-y-1">
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>
                {connectionStatus === "connected" ? "Store is communicating with Stripe." : "Verify your Stripe account details."}
            </CardDescription>
          </div>
          {getBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && (
             <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Verifying credentials...</span>
             </div>
        )}

        {!loading && accountData && (
          <div className="bg-slate-50 rounded-xl p-4 md:p-5 border border-slate-200">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 border-b border-slate-200 pb-4 gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border shadow-sm flex-shrink-0">
                        <User className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{accountData.account_email}</p>
                        <p className="text-xs text-slate-500 font-mono tracking-wide truncate">{accountData.account_id}</p>
                    </div>
                </div>
                <div className="flex sm:justify-end">
                    <Badge variant="outline" className="bg-white font-mono">{accountData.country}</Badge>
                </div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-white rounded-lg border shadow-sm">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Payment</p>
                    <Badge className={accountData.charges_enabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {accountData.charges_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                </div>
                <div className="p-2 bg-white rounded-lg border shadow-sm">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Payout</p>
                    <Badge className={accountData.payouts_enabled ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                        {accountData.payouts_enabled ? "Enabled" : "Paused"}
                    </Badge>
                </div>
                <div className="p-2 bg-white rounded-lg border shadow-sm">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Mode</p>
                    <Badge variant="outline">{accountData.mode}</Badge>
                </div>
             </div>
          </div>
        )}

        {!loading && !accountData && connectionStatus === "error" && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle>Connection Failed</AlertTitle>
                <AlertDescription>The provided API keys are invalid.</AlertDescription>
            </Alert>
        )}

        {/* Buttons Section */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            {/* 👇 Disconnect Button (Only shows if configured) */}
            {isConfigured && (
                <Button 
                    variant="destructive" 
                    onClick={handleDisconnect} 
                    disabled={disconnecting || testing}
                    className="w-full sm:w-auto"
                >
                    {disconnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Disconnect
                </Button>
            )}

            <Button onClick={() => checkConnection(false)} disabled={!isConfigured || testing} variant="outline" className="w-full sm:w-auto">
            {testing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Refreshing...</> : <><RefreshCw className="h-4 w-4 mr-2" /> Refresh Connection</>}
            </Button>
        </div>
      </CardContent>
    </Card>
  )
}