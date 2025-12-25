// app/admin/settings/payments/_components/Payment_Methods_List.tsx
"use client"

import { useState } from "react"
import { PaymentMethodWithConfig } from "@/app/(admin)/admin/settings/payments/types"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Settings2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// Correct Imports based on our file structure
import { Payment_Status_Badge } from "./Payment_Status_Badge"
import { togglePaymentMethodStatus } from "@/app/actions/admin/settings/payments/toggle-method-status"

// Modals
import { Stripe_Main_Modal } from "./Payment_Gateways/Stripe/Stripe_Main_Modal"
import { Paypal_Main_Modal } from "./Payment_Gateways/Paypal/Paypal_Main_Modal"
import { Bank_Transfer_Modal } from "./Offline_Methods/Bank_Transfer_Modal"
import { Cheque_Modal } from "./Offline_Methods/Cheque_Modal"
import { COD_Modal } from "./Offline_Methods/COD_Modal"

interface Props {
  initialMethods: PaymentMethodWithConfig[]
}

// Export name must match exactly what page.tsx expects
export const Payment_Methods_List = ({ initialMethods }: Props) => {
  const router = useRouter()

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const res = await togglePaymentMethodStatus(id, !currentStatus)
    if (res.success) {
      toast.success("Status updated")
      router.refresh()
    } else {
      toast.error("Failed to update status")
    }
  }

  // Function to determine which modal to show
  const renderModal = (method: PaymentMethodWithConfig) => {
    switch (method.identifier) {
      case "stripe":
        return <Stripe_Main_Modal method={method} />
      case "paypal":
        return <Paypal_Main_Modal method={method} />
      case "bank_transfer":
        return <Bank_Transfer_Modal methodId={method.id} config={method} offlineConfig={method.offlineConfig} />
      case "cheque":
        return <Cheque_Modal methodId={method.id} config={method} offlineConfig={method.offlineConfig} />
      case "cod":
        return <COD_Modal methodId={method.id} config={method} offlineConfig={method.offlineConfig} />
      default:
        return (
          <Button variant="outline" size="sm" onClick={() => toast.info("Coming soon")}>
            <Settings2 className="w-4 h-4 mr-2" />
            Manage
          </Button>
        )
    }
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700 border rounded-lg bg-card">
      {initialMethods.map((method) => (
        <div key={method.id} className="flex flex-col sm:flex-row items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors gap-4">
          
          {/* Info Section */}
          <div className="flex items-start gap-4 w-full sm:w-auto">
            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
               {method.identifier === 'stripe' ? (
                 <span className="font-bold text-[#635BFF] text-xl">S</span>
               ) : method.identifier === 'paypal' ? (
                 <span className="font-bold text-[#003087] text-xl">P</span>
               ) : (
                 <span className="font-bold text-gray-500 text-lg">{method.name.charAt(0)}</span>
               )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{method.name}</h3>
                <Payment_Status_Badge isEnabled={method.isEnabled} mode={method.mode} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg">
                {method.description || "No description available."}
              </p>
            </div>
          </div>

          {/* Action Section */}
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <Switch
                checked={method.isEnabled}
                onCheckedChange={() => handleToggle(method.id, method.isEnabled)}
              />
              <span className="text-sm text-muted-foreground sm:hidden">
                {method.isEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            
            {/* Render the correct modal based on identifier */}
            {renderModal(method)}
          </div>
        </div>
      ))}
    </div>
  )
}