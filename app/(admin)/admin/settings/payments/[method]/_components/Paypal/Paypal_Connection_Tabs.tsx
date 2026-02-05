// app/admin/settings/payments/_components/Paypal/Paypal_Connection_Tabs.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertTriangle, Loader2, Info, Eye, EyeOff } from "lucide-react"
import { savePaypalManualCreds } from "@/app/actions/admin/settings/payments/paypal/save-manual-creds"
import { clearPaypalSettings } from "@/app/actions/admin/settings/payments/paypal/clear-database"
import { toast } from "sonner"
import { PaypalConfigType } from "@/app/(admin)/admin/settings/payments/types"
import { useRouter } from "next/navigation"

interface PaypalConnectionProps {
  methodId: string
  config: PaypalConfigType
}

export const Paypal_Connection_Tabs = ({ methodId, config }: PaypalConnectionProps) => {
  const [loading, setLoading] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const router = useRouter()
  const [creds, setCreds] = useState({
    clientId: config.sandbox ? (config.sandboxClientId || "") : (config.liveClientId || ""),
    clientSecret: config.sandbox ? (config.sandboxClientSecret || "") : (config.liveClientSecret || ""),
    email: config.sandbox ? (config.sandboxEmail || "") : (config.liveEmail || ""),
    merchantId: config.merchantId || ""
  })

  const hasCreds = config.sandbox ? !!config.sandboxClientId : !!config.liveClientId
  const handleSave = async (isSandbox: boolean) => {
    setLoading(true)
    const res = await savePaypalManualCreds(methodId, {
      sandbox: isSandbox,
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      email: creds.email,
      merchantId: creds.merchantId
    })
    if (res.success) {
      toast.success(isSandbox ? "Sandbox connected!" : "Live account connected!")
      router.refresh()
    } else toast.error(res.error)
    setLoading(false)
  }

  const handleDisconnect = async () => {
    if(!confirm("Are you sure? This will remove all PayPal keys.")) return;
    setLoading(true)
    await clearPaypalSettings(methodId)
    toast.success("Disconnected successfully")
    router.refresh()
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
            <div><CardTitle>PayPal Connection</CardTitle><CardDescription>Enter your PayPal credentials manually.</CardDescription></div>
            {hasCreds ? 
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-200"><CheckCircle2 size={14} /> Connected</div> : 
                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200"><AlertTriangle size={14} /> Not Connected</div>
            }
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={config.sandbox ? "sandbox" : "live"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="sandbox">Sandbox (Test)</TabsTrigger>
            <TabsTrigger value="live">Live (Production)</TabsTrigger>
          </TabsList>

          {["sandbox", "live"].map((mode) => (
             <TabsContent key={mode} value={mode} className="space-y-4">
                <Alert className={mode === 'sandbox' ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"}>
                    <Info className={mode === 'sandbox' ? "text-yellow-800 h-4 w-4" : "text-blue-800 h-4 w-4"} />
                    <AlertTitle>{mode === 'sandbox' ? "Sandbox Mode" : "Live Mode"}</AlertTitle>
                    <AlertDescription>Enter {mode === 'sandbox' ? "Sandbox Business" : "Real Business"} details.</AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>PayPal Email</Label><Input value={creds.email} onChange={(e) => setCreds({...creds, email: e.target.value})} placeholder="email@example.com" /></div>
                    <div className="space-y-2"><Label>Merchant ID</Label><Input value={creds.merchantId} onChange={(e) => setCreds({...creds, merchantId: e.target.value})} placeholder="WUC89X..." /></div>
                </div>
                <div className="space-y-2"><Label>Client ID</Label><Input value={creds.clientId} onChange={(e) => setCreds({...creds, clientId: e.target.value})} className="font-mono text-xs" /></div>
                <div className="space-y-2"><Label>Secret</Label>
                    <div className="relative">
                        <Input type={showSecret ? "text" : "password"} value={creds.clientSecret} onChange={(e) => setCreds({...creds, clientSecret: e.target.value})} className="font-mono text-xs pr-10" />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2" onClick={() => setShowSecret(!showSecret)}>{showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                    </div>
                </div>
                <div className="pt-4 border-t mt-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                    {hasCreds && <Button variant="destructive" onClick={handleDisconnect} type="button" className="w-full sm:w-auto">Disconnect</Button>}
                    <Button onClick={() => handleSave(mode === 'sandbox')} disabled={loading} className="w-full sm:w-auto bg-[#0070BA] hover:bg-[#003087]">
                        {loading && <Loader2 className="animate-spin mr-2 h-4 w-4"/>} Connect {mode}
                    </Button>
                </div>
             </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}