"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertTriangle, RadioReceiver, Loader2, User, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StripeConfigType } from "@/app/admin/settings/payments/types"
import { toast } from "sonner"
import { testStripeConnection } from "@/app/actions/settings/payments/stripe/test-connection"

interface ConnectionCardProps {
  config: StripeConfigType
  methodId: string
}

export const Stripe_Connection_Card = ({ config, methodId }: ConnectionCardProps) => {
  const [testing, setTesting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [accountData, setAccountData] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connected" | "error">("idle")

  // Check if keys exist locally
  const hasKeys = config.testMode 
    ? !!config.testSecretKey 
    : !!config.liveSecretKey;

  const isConfigured = config.isConnected || hasKeys;

  // 👇 ফাংশন: কানেকশন টেস্ট এবং ডাটা লোড করা
  const checkConnection = async (isAuto = false) => {
    if (!isConfigured) {
        setLoading(false);
        return;
    }

    setTesting(true)
    if(!isAuto) setLoading(true) // ম্যানুয়াল ক্লিকে লোডিং দেখাব
    
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

  // 👇 অটোমেটিক লোড: পেজ ওপেন করলেই চেক করবে
  useEffect(() => {
    if (isConfigured) {
        checkConnection(true);
    } else {
        setLoading(false);
    }
  }, [config.testMode, methodId]); // কনফিগারেশন চেঞ্জ হলে আবার চেক করবে

  // ব্যাজ কালার এবং টেক্সট নির্ধারণ
  const getBadge = () => {
    if (!isConfigured) return <Badge variant="destructive">Not Configured</Badge>;
    if (loading) return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Checking...</Badge>;
    if (connectionStatus === "connected") return <Badge className="bg-green-600 hover:bg-green-700">Connected</Badge>;
    if (connectionStatus === "error") return <Badge variant="destructive">Connection Error</Badge>;
    return <Badge variant="secondary">Keys Saved</Badge>;
  }

  return (
    <Card className={`border-l-4 transition-all duration-300 ${
        connectionStatus === "connected" ? "border-l-green-500 shadow-sm" : 
        connectionStatus === "error" ? "border-l-red-500" : "border-l-slate-300"
    }`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>
                {connectionStatus === "connected" 
                    ? "Your store is successfully communicating with Stripe." 
                    : "Verify your Stripe account details."}
            </CardDescription>
          </div>
          {getBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* লোডিং অবস্থা */}
        {loading && (
             <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Verifying credentials...</span>
             </div>
        )}

        {/* কানেক্টেড অবস্থা (ডিটেইলস ভিউ) */}
        {!loading && accountData && (
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
             <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border shadow-sm">
                        <User className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">{accountData.account_email}</p>
                        <p className="text-xs text-slate-500 font-mono tracking-wide">{accountData.account_id}</p>
                    </div>
                </div>
                <div className="text-right">
                    <Badge variant="outline" className="bg-white font-mono">{accountData.country}</Badge>
                </div>
             </div>

             <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Payment</p>
                    <Badge className={accountData.charges_enabled ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" : "bg-red-100 text-red-700"}>
                        {accountData.charges_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Payout</p>
                    <Badge className={accountData.payouts_enabled ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}>
                        {accountData.payouts_enabled ? "Enabled" : "Paused"}
                    </Badge>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Mode</p>
                    <Badge variant="outline" className={accountData.mode === 'Live' ? "border-purple-200 text-purple-700 bg-purple-50" : "border-orange-200 text-orange-700 bg-orange-50"}>
                        {accountData.mode}
                    </Badge>
                </div>
             </div>
          </div>
        )}

        {/* এরর অবস্থা */}
        {!loading && !accountData && connectionStatus === "error" && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle>Connection Failed</AlertTitle>
                <AlertDescription>
                   The provided API keys are invalid. Please check your keys in the General tab.
                </AlertDescription>
            </Alert>
        )}

        {/* বাটন */}
        <div className="flex justify-end">
            <Button 
            onClick={() => checkConnection(false)} 
            disabled={!isConfigured || testing}
            variant="outline"
            className="w-full sm:w-auto gap-2 border-slate-300 hover:bg-slate-50"
            >
            {testing ? (
                <>
                <Loader2 className="h-4 w-4 animate-spin" /> Refreshing...
                </>
            ) : (
                <>
                <RefreshCw className={`h-4 w-4 ${connectionStatus === 'connected' ? 'text-green-600' : 'text-slate-500'}`} />
                {accountData ? "Refresh Connection" : "Test Connection"}
                </>
            )}
            </Button>
        </div>
      </CardContent>
    </Card>
  )
}