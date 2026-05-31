//File 6: app/admin/settings/payments/_components/Payment_Methods_List.tsx

"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2, AlertCircle, CheckCircle2, History } from "lucide-react" // ✅ Added History Icon
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toggleGatewayStatus, resetPaymentGatewaysDB } from "@/app/actions/backend/settings/payments/core-actions"
import { PaymentGatewayUI } from "@/app/(backend)/admin/settings/payments/types-and-schemas"

interface Props {
  initialMethods: PaymentGatewayUI[]
}

export const Payment_Methods_List = ({ initialMethods }: Props) => {
  const router = useRouter()
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setTogglingId(id)
    try {
        const res = await toggleGatewayStatus(id, !currentStatus)
        if (res.success) {
          toast.success("Settings saved.")
          router.refresh()
        } else {
          toast.error(res.error || "Failed to update status")
        }
    } catch (error) {
        toast.error("Something went wrong")
    } finally {
        setTogglingId(null)
    }
  }

  const handleReset = async () => {
    if(!confirm("Are you sure? This will reset all API Keys and settings to default.")) return;
    setIsResetting(true)
    try {
        const res = await resetPaymentGatewaysDB()
        if(res.success) {
          toast.success("Database Repaired Successfully!")
          router.refresh()
        } else {
          toast.error(res.error || "Failed to repair")
        }
    } finally {
        setIsResetting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* WordPress Style Description & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <p className="text-[#3c434a] m-0">Installed payment methods are listed below. Drag and drop to control their display order on the frontend.</p>
        
        {/* ✅ FIX: Added View Logs Button next to Repair Button */}
        <div className="flex items-center gap-3">
          <Link href="/admin/settings/payments/logs">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs font-normal bg-white border-[#8c8f94] text-[#3c434a] hover:bg-[#f6f7f7] hover:text-[#1d2327]"
            >
              <History className="h-3.5 w-3.5 mr-1.5" />
              View Logs
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset} 
            disabled={isResetting}
            className="h-8 text-xs font-normal bg-white border-[#8c8f94] text-[#2271b1] hover:bg-[#f6f7f7] hover:text-[#0a4b78]"
          >
            {isResetting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            Repair Defaults
          </Button>
        </div>
      </div>

      {/* WooCommerce Style WP List Table */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-x-auto">
        <table className="w-full text-left text-[13px] text-[#3c434a] border-collapse">
          <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
            <tr>
              <th className="py-2 px-3 font-semibold text-[#1d2327] w-14 text-center">Enabled</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327] w-[25%]">Method</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327]">Description</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327] w-32 text-center">Status</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327] w-24 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {initialMethods.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#8c8f94]">
                  No payment methods found. Click "Repair Defaults".
                </td>
              </tr>
            )}

            {initialMethods.map((method, index) => (
              <tr key={method.id} className={`${index % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"} hover:bg-[#f0f0f1] transition-colors group`}>
                
                {/* Toggle Column */}
                <td className="py-3 px-3 text-center align-middle">
                  {togglingId === method.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#8c8f94] mx-auto" />
                  ) : (
                    <Switch
                      checked={method.isEnabled}
                      onCheckedChange={() => handleToggle(method.id, method.isEnabled)}
                      disabled={togglingId === method.id}
                      className="scale-90"
                    />
                  )}
                </td>

                {/* Name Column */}
                <td className="py-3 px-3 align-middle">
                  <div className="font-semibold text-[13px]">
                    <Link href={`/admin/settings/payments/${method.identifier}`} className="text-[#2271b1] hover:text-[#0a4b78] hover:underline focus:shadow-none focus:outline-none">
                      {method.name}
                    </Link>
                  </div>
                  <div className="text-[12px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/admin/settings/payments/${method.identifier}`} className="text-[#2271b1] hover:text-[#0a4b78]">Manage</Link>
                  </div>
                </td>

                {/* Description Column */}
                <td className="py-3 px-3 align-middle text-[#50575e]">
                  {method.description || "—"}
                  {method.mode === "TEST" && (
                    <span className="ml-2 inline-block text-[11px] font-semibold text-[#d63638]">
                      (TEST MODE)
                    </span>
                  )}
                </td>

                {/* Connection Status Column */}
                <td className="py-3 px-3 text-center align-middle">
                  {(method.provider === "STRIPE" || method.provider === "PAYPAL") ? (
                    method.isConnected ? (
                       <span className="inline-flex items-center text-[#00a32a] text-xs font-medium" title="API Keys Verified">
                         <CheckCircle2 className="h-4 w-4 mr-1" /> Connected
                       </span>
                    ) : (
                       <span className="inline-flex items-center text-[#d63638] text-xs font-medium" title="API Keys Missing">
                         <AlertCircle className="h-4 w-4 mr-1" /> Missing Keys
                       </span>
                    )
                  ) : (
                    <span className="text-[#8c8f94] text-xs">—</span>
                  )}
                </td>

                {/* Actions Column */}
                <td className="py-3 px-3 text-right align-middle">
                  <Link href={`/admin/settings/payments/${method.identifier}`}>
                    <Button variant="outline" size="sm" className="h-7 px-3 text-xs font-normal border-[#8c8f94] text-[#3c434a] hover:bg-[#f6f7f7]">
                      Manage
                    </Button>
                  </Link>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}