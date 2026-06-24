//File 16: app/admin/settings/payments/[identifier]/_components/Paypal/Paypal_Webhook_Config.tsx


"use client"

import { useState, useEffect } from "react"
import { PaymentGatewayUI } from "@/app/(backend)/admin/settings/payments/types-and-schemas"
import { refreshPaypalWebhook, savePaypalManualWebhook } from "@/app/actions/backend/settings/payments/paypal-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RefreshCw, CheckCircle2, XCircle, Globe, Webhook, Loader2, EyeOff, Eye, Save } from "lucide-react"

export const Paypal_Webhook_Config = ({ method }: { method: PaymentGatewayUI }) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [localUrl, setLocalUrl] = useState<string>("")
  const [showSecret, setShowSecret] = useState(false)
  const router = useRouter()
  
  // State for manual input
  const [manualId, setManualId] = useState("")
  
  useEffect(() => {
    if (method.webhookSecret) {
      setManualId(method.webhookSecret)
    }
  }, [method.webhookSecret])

  const isTestMode = method.mode === "TEST";
  const isConnected = method.isConnected;
  const hasWebhook = !!method.webhookUrl && !!method.webhookSecret;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocalUrl(`${window.location.origin}/api/webhooks/paypal`)
    }
  }, [])

  // Auto Create / Sync Webhook
  const handleSync = async () => {
    if (!isConnected) {
      toast.error("Please connect PayPal API Keys first.");
      return;
    }
    
    setIsRefreshing(true)
    try {
      const res = await refreshPaypalWebhook(method.id)
      if (res.success) {
        toast.success(res.message)
        router.refresh()
      } else toast.error(res.error)
    } catch (error) { 
      toast.error("Something went wrong") 
    } finally { 
      setIsRefreshing(false) 
    }
  }

  // Save Manual Webhook ID
  const handleManualSave = async () => {
    if (!manualId) {
      toast.error("Please enter a Webhook ID first.");
      return;
    }

    setIsSaving(true)
    try {
      const res = await savePaypalManualWebhook(method.id, manualId, method.webhookUrl || localUrl)
      if (res.success) {
        toast.success(res.message)
        router.refresh()
      } else toast.error(res.error)
    } catch (error) { 
      toast.error("Failed to save manually") 
    } finally { 
      setIsSaving(false) 
    }
  }

  // WooCommerce Table Row Helper
  const FormRow = ({ label, children, isLast = false }: { label: string, children: React.ReactNode, isLast?: boolean }) => (
    <div className={`flex flex-col md:flex-row py-5 px-6 ${!isLast ? 'border-b border-gray-200' : ''}`}>
      <div className="w-full md:w-1/3 mb-2 md:mb-0 text-sm font-semibold text-gray-700">{label}</div>
      <div className="w-full md:w-2/3">{children}</div>
    </div>
  )

  return (
    <div>
      {/* Notice Banner */}
      {!isConnected ? (
         <div className="p-4 bg-red-50 border-b border-red-200 text-sm text-red-700">
           ⚠️ Please connect your PayPal API Keys in the "Connection" tab before setting up webhooks.
         </div>
      ) : (
        <div className={`p-4 border-b text-sm flex items-center gap-3 ${hasWebhook ? 'bg-green-50 text-green-800 border-green-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>
           {hasWebhook ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <XCircle className="h-5 w-5 flex-shrink-0" />}
           <p>Webhook Status: <strong>{hasWebhook ? "Active" : "Not Configured"}</strong> ({isTestMode ? "Sandbox" : "Live"} Environment)</p>
        </div>
      )}

      <div className="space-y-0">
        
        <FormRow label="Webhook Endpoint URL">
          <div className="flex items-center gap-2 p-2 bg-gray-100 border border-gray-300 rounded-sm text-gray-700 font-mono text-[13px] break-all">
              <Globe className="h-4 w-4 flex-shrink-0 text-[#003087]" />
              <span>{method.webhookUrl || localUrl}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This is the URL where PayPal sends payment notifications.
          </p>
        </FormRow>

        <FormRow label="Webhook ID">
          <div className="flex flex-col sm:flex-row gap-3">
             <div className="relative flex-1 max-w-md">
               <Input 
                 type={showSecret ? "text" : "password"} 
                 value={manualId} 
                 onChange={(e) => setManualId(e.target.value)} 
                 placeholder="e.g. 8XC234..." 
                 className="font-mono text-[13px] bg-white border-gray-300 h-9 pr-10" 
               />
               <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 text-gray-500 hover:text-gray-700" onClick={() => setShowSecret(!showSecret)}>
                 {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
               </Button>
             </div>
             
             <Button 
               onClick={handleManualSave} 
               disabled={isSaving || !manualId || !isConnected} 
               className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 h-9 px-4 text-sm"
             >
               {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} 
               Save Manual ID
             </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">If you added the webhook manually in PayPal, paste the Webhook ID here and save.</p>
        </FormRow>

        <FormRow label="Automatic Setup" isLast>
          <Button 
            onClick={handleSync} 
            disabled={isRefreshing || !isConnected} 
            className="bg-[#003087] hover:bg-[#00205e] text-white h-9 px-6 text-sm"
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Webhook className="h-4 w-4 mr-2" />} 
            {hasWebhook ? "Re-sync Webhook Automatically" : "Auto Create Webhook"}
          </Button>
          <p className="text-xs text-gray-500 mt-2">Clicking this will automatically create the webhook in your PayPal account and save the ID.</p>
        </FormRow>

      </div>
    </div>
  )
}