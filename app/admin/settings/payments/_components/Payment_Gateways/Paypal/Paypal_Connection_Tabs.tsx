// app/admin/settings/payments/_components/Payment_Gateways/Paypal/Paypal_Connection_Tabs.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertTriangle, Loader2, Info, Eye, EyeOff } from "lucide-react"
import { savePaypalManualCreds } from "@/app/actions/settings/payments/paypal/save-manual-creds"
import { clearPaypalSettings } from "@/app/actions/settings/payments/paypal/clear-database"
import { toast } from "sonner" // 👈 Toast import
import { PaypalConfigType } from "@/app/admin/settings/payments/types"
import { useRouter } from "next/navigation"

interface PaypalConnectionProps {
  methodId: string
  config: PaypalConfigType
}

export const Paypal_Connection_Tabs = ({ methodId, config }: PaypalConnectionProps) => {
  const [loading, setLoading] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const router = useRouter()
  
  // Credentials State
  const [creds, setCreds] = useState({
    clientId: config.sandbox ? (config.sandboxClientId || "") : (config.liveClientId || ""),
    clientSecret: config.sandbox ? (config.sandboxClientSecret || "") : (config.liveClientSecret || ""),
    email: config.sandbox ? (config.sandboxEmail || "") : (config.liveEmail || ""),
    merchantId: config.merchantId || ""
  })

  // Detect connection status
  const hasCreds = config.sandbox 
    ? !!config.sandboxClientId && !!config.sandboxClientSecret
    : !!config.liveClientId && !!config.liveClientSecret

  const handleSave = async (isSandbox: boolean) => {
    setLoading(true)
    
    // Server Action Call
    const res = await savePaypalManualCreds(methodId, {
      sandbox: isSandbox,
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      email: creds.email,
      merchantId: creds.merchantId
    })

    if (res.success) {
      // ✅ Success Message
      toast.success(
        isSandbox 
          ? "Sandbox connected successfully!" 
          : "Live account connected successfully!"
      )
      router.refresh()
    } else {
      // ❌ Error Message with Reason
      toast.error(res.error || "Connection failed. Please check your keys.")
    }
    
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
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>PayPal Connection</CardTitle>
                <CardDescription>Enter your PayPal credentials manually.</CardDescription>
            </div>
            {hasCreds ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                    <CheckCircle2 size={14} /> Connected
                </div>
            ) : (
                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">
                    <AlertTriangle size={14} /> Not Connected
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={config.sandbox ? "sandbox" : "live"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="sandbox">Sandbox (Test)</TabsTrigger>
            <TabsTrigger value="live">Live (Production)</TabsTrigger>
          </TabsList>

          {/* === SANDBOX FORM === */}
          <TabsContent value="sandbox" className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-200 mb-4">
              <Info className="h-4 w-4 text-yellow-800" />
              <AlertTitle className="text-yellow-800">Sandbox Mode</AlertTitle>
              <AlertDescription className="text-yellow-700">
                Enter your <span className="font-bold">Sandbox Business Account</span> details.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>
                        PayPal Email Address <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
                    </Label>
                    <Input 
                        value={creds.email} 
                        onChange={(e) => setCreds({...creds, email: e.target.value})}
                        placeholder="sb-business@example.com" 
                    />
                </div>
                <div className="space-y-2">
                    <Label>
                        Merchant ID <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
                    </Label>
                    <Input 
                        value={creds.merchantId} 
                        onChange={(e) => setCreds({...creds, merchantId: e.target.value})}
                        placeholder="e.g. WUC89X..." 
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Sandbox Client ID</Label>
                <Input 
                    value={creds.clientId} 
                    onChange={(e) => setCreds({...creds, clientId: e.target.value})}
                    placeholder="AbC..." 
                    className="font-mono text-xs"
                />
            </div>
            
            {/* Secret with Eye Icon */}
            <div className="space-y-2">
                <Label>Sandbox Secret</Label>
                <div className="relative">
                    <Input 
                        type={showSecret ? "text" : "password"}
                        value={creds.clientSecret} 
                        onChange={(e) => setCreds({...creds, clientSecret: e.target.value})}
                        placeholder="EMj..." 
                        className="font-mono text-xs pr-10"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                        onClick={() => setShowSecret(!showSecret)}
                    >
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            
            <div className="flex justify-between pt-4 border-t mt-4">
                {hasCreds && (
                    <Button variant="destructive" onClick={handleDisconnect} type="button">Disconnect</Button>
                )}
                <Button onClick={() => handleSave(true)} disabled={loading} className="ml-auto bg-[#0070BA] hover:bg-[#003087]">
                    {loading && <Loader2 className="animate-spin mr-2 h-4 w-4"/>} 
                    Verify & Connect Sandbox
                </Button>
            </div>
          </TabsContent>

          {/* === LIVE FORM === */}
          <TabsContent value="live" className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200 mb-4">
              <Info className="h-4 w-4 text-blue-800" />
              <AlertTitle className="text-blue-800">Live Mode</AlertTitle>
              <AlertDescription className="text-blue-700">
                Enter your <span className="font-bold">Real Business Account</span> details.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>
                        PayPal Email Address <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
                    </Label>
                    <Input 
                        value={creds.email} 
                        onChange={(e) => setCreds({...creds, email: e.target.value})}
                        placeholder="your-email@business.com" 
                    />
                </div>
                <div className="space-y-2">
                    <Label>
                        Merchant ID <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
                    </Label>
                    <Input 
                        value={creds.merchantId} 
                        onChange={(e) => setCreds({...creds, merchantId: e.target.value})}
                        placeholder="e.g. WUC89X..." 
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Live Client ID</Label>
                <Input 
                      value={creds.clientId} 
                      onChange={(e) => setCreds({...creds, clientId: e.target.value})}
                      placeholder="AbC..." 
                      className="font-mono text-xs"
                />
            </div>
            
            {/* Secret with Eye Icon */}
            <div className="space-y-2">
                <Label>Live Secret</Label>
                <div className="relative">
                    <Input 
                        type={showSecret ? "text" : "password"}
                        value={creds.clientSecret} 
                        onChange={(e) => setCreds({...creds, clientSecret: e.target.value})}
                        placeholder="EMj..." 
                        className="font-mono text-xs pr-10"
                    />
                     <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                        onClick={() => setShowSecret(!showSecret)}
                    >
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <div className="flex justify-between pt-4 border-t mt-4">
                {hasCreds && (
                    <Button variant="destructive" onClick={handleDisconnect} type="button">Disconnect</Button>
                )}
                <Button onClick={() => handleSave(false)} disabled={loading} className="ml-auto bg-[#0070BA] hover:bg-[#003087]">
                    {loading && <Loader2 className="animate-spin mr-2 h-4 w-4"/>} 
                    Verify & Connect Live
                </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}