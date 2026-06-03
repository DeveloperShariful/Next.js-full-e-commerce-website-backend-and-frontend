//File 3: app/admin/settings/payments/logs/page.tsx

import { getPaymentLogs } from "@/app/actions/backend/settings/payments/logs-actions"
import { PaymentLogsTable } from "./_components/PaymentLogsTable"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function PaymentLogsPage() {
  const { success, data: logs, error } = await getPaymentLogs(30) // Fetch last 30 days logs

  return (
    <div className="w-full bg-[#f0f0f1] min-h-screen pb-20 font-sans text-[13px] text-[#3c434a]">
      
      {/* WordPress Style Page Header */}
      <div className="w-full">
        <div className="flex items-center gap-3 mb-2">
          <Link 
            href="/admin/settings?tab=payments" 
            className="text-gray-500 hover:text-gray-900 transition-colors p-1.5 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[23px] font-normal text-[#1d2327] m-0">Payment Logs</h1>
        </div>
        <p className="text-[#3c434a] m-0 text-[14px] ml-10">
          Track all payment transactions, API errors, and admin setting changes from the last 30 days.
        </p>
      </div>
      
      {/* Main Content Area */}
      <div className="w-full ">
        {!success ? (
           <div className="p-3 bg-white border-l-4 border-[#d63638] shadow-sm flex items-center gap-3 text-[#d63638]">
              <AlertTriangle className="h-5 w-5" />
              <p>Failed to load logs: {error}</p>
           </div>
        ) : (
           <PaymentLogsTable initialLogs={logs || []} />
        )}
      </div>
      
    </div>
  )
}