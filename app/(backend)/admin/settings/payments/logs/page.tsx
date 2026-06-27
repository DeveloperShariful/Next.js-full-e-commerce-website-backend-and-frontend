import { getPaymentLogs, getWebhookLogs } from "@/app/actions/backend/settings/payments/logs-actions"
import { PaymentLogsTable } from "./_components/PaymentLogsTable"
import { WebhookLogsTable } from "./_components/WebhookLogsTable"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function PaymentLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = "activity" } = await searchParams

  const [activityResult, webhookResult] = await Promise.all([
    getPaymentLogs(30),
    getWebhookLogs(30),
  ])

  const tabs = [
    { id: "activity", label: "Payment Activity" },
    { id: "webhooks", label: "Webhook Events" },
  ]

  return (
    <div className="w-full bg-[#f0f0f1] min-h-screen pb-20 font-sans text-[13px] text-[#3c434a]">

      {/* Header */}
      <div className="w-full mb-4">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/admin/settings?tab=payments"
            className="text-gray-500 hover:text-gray-900 transition-colors p-1.5 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[23px] font-normal text-[#1d2327] m-0">Payment Logs</h1>
        </div>
        <p className="text-[#3c434a] m-0 text-[14px] ml-10">
          Payment transactions, webhook events, and admin setting changes — last 30 days.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-4 border-b border-[#c3c4c7]">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/admin/settings/payments/logs?tab=${t.id}`}
            className={`px-4 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-[#2271b1] text-[#2271b1] bg-white"
                : "border-transparent text-[#50575e] hover:text-[#1d2327]"
            }`}
          >
            {t.label}
            {t.id === "webhooks" && webhookResult.data && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-[#f0f0f1] text-[#50575e]">
                {webhookResult.data.filter((w) => !w.processed || w.processingError).length > 0
                  ? `${webhookResult.data.filter((w) => !w.processed || w.processingError).length} issues`
                  : webhookResult.data.length}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Content */}
      {tab === "activity" && (
        !activityResult.success ? (
          <div className="p-3 bg-white border-l-4 border-[#d63638] shadow-sm flex items-center gap-3 text-[#d63638]">
            <AlertTriangle className="h-5 w-5" />
            <p>Failed to load logs: {activityResult.error}</p>
          </div>
        ) : (
          <PaymentLogsTable initialLogs={activityResult.data || []} />
        )
      )}

      {tab === "webhooks" && (
        !webhookResult.success ? (
          <div className="p-3 bg-white border-l-4 border-[#d63638] shadow-sm flex items-center gap-3 text-[#d63638]">
            <AlertTriangle className="h-5 w-5" />
            <p>Failed to load webhook logs: {webhookResult.error}</p>
          </div>
        ) : (
          <WebhookLogsTable initialLogs={webhookResult.data || []} />
        )
      )}

    </div>
  )
}
