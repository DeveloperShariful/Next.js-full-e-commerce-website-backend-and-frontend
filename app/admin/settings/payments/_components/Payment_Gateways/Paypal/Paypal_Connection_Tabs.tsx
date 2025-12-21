// app/admin/settings/payments/_components/Payment_Gateways/Paypal/Paypal_Connection_Tabs.tsx
"use client"

import { useState, useTransition } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"

// 👇 FIX: Imported from dedicated Paypal components
import { Paypal_Connect_Button } from "./Components/Paypal_Connect_Button"
import { PaypalConfigType } from "@/app/admin/settings/payments/types"
import { savePaypalManualCreds } from "@/app/actions/settings/payments/paypal/save-manual-creds"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ConnectionTabsProps {
  config: PaypalConfigType
  methodId: string
}

export const Paypal_Connection_Tabs = ({ config, methodId }: ConnectionTabsProps) => {
  const [activeTab, setActiveTab] = useState("automatic")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  
  const [manualSandbox, setManualSandbox] = useState(config.sandbox)
  const [manualClientId, setManualClientId] = useState(config.sandbox ? config.sandboxClientId || "" : config.liveClientId || "")
  const [manualSecret, setManualSecret] = useState(config.sandbox ? config.sandboxClientSecret || "" : config.liveClientSecret || "")
  const [manualEmail, setManualEmail] = useState(config.sandbox ? config.sandboxEmail || "" : config.liveEmail || "")

  const handleOAuthConnect = () => {
    // FIX: Opening a real popup window
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    // Note: Use your actual Partner Link here
    const partnerUrl = "https://www.sandbox.paypal.com/bizsignup/partner/entry?partnerId=REST_API_PARTNER_ID"; 
    
    window.open(
      partnerUrl, 
      "PayPalConnect", 
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
    );
    
    toast.info("PayPal Login Window Opened", {
        description: "If nothing happened, please allow popups for this site."
    });
  }

  const handleManualSave = () => {
    startTransition(() => {
      savePaypalManualCreds(methodId, {
        sandbox: manualSandbox,
        clientId: manualClientId,
        clientSecret: manualSecret,
        email: manualEmail
      }).then((res) => {
        if (res.success) {
          toast.success("Credentials saved successfully")
          router.refresh()
        } else {
          toast.error("Failed to save credentials")
        }
      })
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Connection Settings</h2>
        {config.liveClientId || config.sandboxClientId ? (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Connected
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            Not Connected
          </div>
        )}
      </div>

      <Tabs defaultValue="automatic" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="automatic">Automatic Connect (Recommended)</TabsTrigger>
          <TabsTrigger value="manual">Manual API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="automatic" className="space-y-4 pt-4">
          <Card className="border-l-4 border-l-[#003087]">
            <CardHeader>
              <CardTitle>PayPal Partner Connection</CardTitle>
              <CardDescription>
                Securely connect your account without copying and pasting API keys.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 gap-6 border border-dashed rounded-lg bg-gray-50/50">
                {/* 👇 FIX: Used dedicated button (no providerName prop needed) */}
                <Paypal_Connect_Button 
                  isConnected={config.isOnboarded} 
                  onClick={handleOAuthConnect}
                />
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Clicking connect will open a PayPal login window. <br/>
                  <span className="text-xs italic">(Requires a PayPal Partner Account ID in production)</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual API Credentials</CardTitle>
              <CardDescription>
                Manually enter your REST API credentials from the PayPal Developer Dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border p-3 rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                  <Label>Sandbox Mode</Label>
                  <p className="text-xs text-muted-foreground">Enable for testing without real money.</p>
                </div>
                <Switch 
                  checked={manualSandbox} 
                  onCheckedChange={setManualSandbox} 
                />
              </div>
              
              {/* Manual Input Fields... (No changes here) */}
              <div className="space-y-2">
                <Label>PayPal Email</Label>
                <Input value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} placeholder="merchant@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input value={manualClientId} onChange={(e) => setManualClientId(e.target.value)} type="password" placeholder="Enter Client ID" />
              </div>
              <div className="space-y-2">
                <Label>Secret Key</Label>
                <Input value={manualSecret} onChange={(e) => setManualSecret(e.target.value)} type="password" placeholder="Enter Secret Key" />
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={handleManualSave} disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Credentials
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}