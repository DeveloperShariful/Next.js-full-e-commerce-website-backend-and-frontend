//File 10: app/admin/settings/payments/[identifier]/_components/Stripe/Stripe_Connection_Card.tsx

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react"
import { PaymentGatewayUI } from "@/app/(backend)/admin/settings/payments/types-and-schemas"
import { connectStripeKeys, disconnectStripe } from "@/app/actions/backend/settings/payments/stripe-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export const Stripe_Connection_Card = ({ method }: { method: PaymentGatewayUI }) => {
  const [testing, setTesting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const router = useRouter()

  const isTestMode = method.mode === "TEST";
  const isConfigured = method.isConnected;

  const [creds, setCreds] = useState({
    publishableKey: method.publicKey || "",
    secretKey: "" 
  })

  const handleSaveAndConnect = async () => {
    if (!creds.publishableKey || !creds.secretKey) {
      toast.error("Please enter both Publishable and Secret Keys.");
      return;
    }
    setTesting(true);
    const res = await connectStripeKeys(method.id, creds.publishableKey, creds.secretKey);
    
    if (res.success) {
      toast.success(res.message);
      setCreds({ ...creds, secretKey: "" }); 
      router.refresh();
    } else {
      toast.error("Connection Failed", { description: res.error });
    }
    setTesting(false);
  }

  const handleDisconnect = async () => {
    if(!confirm("Are you sure? This will delete Stripe keys and disable the method.")) return;
    setDisconnecting(true);
    const res = await disconnectStripe(method.id);
    if (res.success) {
        toast.success(res.message);
        setCreds({ publishableKey: "", secretKey: "" });
        router.refresh();
    } else toast.error(res.error || "Failed to disconnect");
    setDisconnecting(false);
  }

  // ✅ FIX: Changed w-1/3 to fixed w-[250px] and w-2/3 to flex-1
  const FormRow = ({ label, children, isLast = false }: { label: string, children: React.ReactNode, isLast?: boolean }) => (
    <div className={`flex flex-col md:flex-row py-5 px-6 ${!isLast ? 'border-b border-gray-200' : ''}`}>
      <div className="w-full md:w-[300px] flex-shrink-0 mb-2 md:mb-0 text-sm font-semibold text-gray-700">{label}</div>
      <div className="w-full flex-1">{children}</div>
    </div>
  )

  return (
    <div>
      {/* Notice Banner */}
      <div className="p-4 bg-yellow-50 border-b border-yellow-200 text-sm text-yellow-800 flex items-center gap-3">
         <AlertTriangle className="h-5 w-5 flex-shrink-0" />
         <p>You are currently in <strong>{isTestMode ? "Test" : "Live"} Mode</strong>. Please enter your {isTestMode ? "test" : "live"} API keys below.</p>
      </div>

      <div className="space-y-0">
        <FormRow label="Publishable Key">
          {/* ✅ FIX: w-full added, max-w-md removed */}
          <Input 
            value={creds.publishableKey} 
            onChange={(e) => setCreds({...creds, publishableKey: e.target.value})} 
            placeholder={`pk_${method.mode.toLowerCase()}_...`} 
            className="w-full font-mono text-sm bg-white border-gray-300 h-9" 
          />
          <p className="text-xs text-gray-500 mt-1.5">Get this from your Stripe Dashboard &gt; Developers &gt; API Keys.</p>
        </FormRow>

        <FormRow label="Secret Key" isLast>
          {/* ✅ FIX: w-full added, max-w-md removed */}
          <div className="relative w-full">
            <Input 
              type={showSecret ? "text" : "password"} 
              value={creds.secretKey} 
              onChange={(e) => setCreds({...creds, secretKey: e.target.value})} 
              placeholder={isConfigured ? "••••••••••••••••••••••••" : `sk_${method.mode.toLowerCase()}_...`} 
              className="w-full font-mono text-sm bg-white border-gray-300 h-9 pr-10" 
            />
            <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 text-gray-500 hover:text-gray-700" onClick={() => setShowSecret(!showSecret)}>
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {isConfigured && <p className="text-xs text-blue-600 mt-1.5 font-medium">Keys are saved securely. Enter a new key to update.</p>}
        </FormRow>
      </div>

      {/* Action Area */}
      {/* Action Area */}
      {/* ✅ FIX: Made container responsive. Column on mobile, row on desktop */}
      <div className="bg-gray-50 p-4 border-t border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-b-sm">
          <div className="text-center sm:text-left">
              {isConfigured ? (
                  <span className="text-sm font-medium text-green-600">✅ Connected to Stripe</span>
              ) : (
                  <span className="text-sm font-medium text-red-600">❌ Not Connected</span>
              )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row w-full sm:w-auto gap-3">
              {isConfigured && (
                  <Button 
                    variant="outline" 
                    onClick={handleDisconnect} 
                    disabled={disconnecting || testing} 
                    className="w-full sm:w-auto h-9 px-4 text-sm text-red-600 border-gray-300 hover:bg-red-50"
                  >
                      {disconnecting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} 
                      Disconnect
                  </Button>
              )}
              <Button 
                onClick={handleSaveAndConnect} 
                disabled={testing || (!creds.publishableKey && !isConfigured)} 
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-9 px-6 text-sm"
              >
                {testing && <Loader2 className="h-4 w-4 animate-spin mr-2" />} 
                {isConfigured ? "Update Keys" : "Save & Verify"}
              </Button>
          </div>
      </div>
    </div>
  )
}