// app/(backend)/admin/settings/payments/page.tsx
// Server Component — data fetched server-side so router.refresh() works correctly
export const dynamic = "force-dynamic"

import { AlertTriangle } from "lucide-react"
import { getAllPaymentGateways } from "@/app/actions/backend/settings/payments/core-actions"
import { Payment_Methods_List } from "./_components/Payment_Methods_List"

export default async function PaymentsPage() {
  const res = await getAllPaymentGateways()

  return (
    <div className="w-full font-sans text-[13px] text-[#3c434a]">
      <div className="py-1 mb-4">
        <h1 className="text-xl font-bold text-slate-800">Payment Settings</h1>
        <p className="text-[#3c434a] m-0 text-[14px]">
          Manage how your customers pay at checkout. Turn methods on/off and configure credentials.
        </p>
      </div>

      {!res.success ? (
        <div className="p-3 bg-white border-l-4 border-[#d63638] shadow-sm flex items-center gap-3 text-[#d63638]">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p className="m-0">Failed to load payment methods: {res.error}</p>
        </div>
      ) : (
        <Payment_Methods_List initialMethods={res.data || []} />
      )}
    </div>
  )
}
