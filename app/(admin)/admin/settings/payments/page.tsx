// app/admin/settings/payments/page.tsx

import { getAllPaymentMethods } from "@/app/actions/admin/settings/payments/payments-dashboard"
import { Payment_Methods_List } from "./_components/Payment_Methods_List"

export default async function PaymentSettingsPage() {
  const { data: methods } = await getAllPaymentMethods()

  return (
    <div className="flex flex-col gap-6 p-6">
      
      {/* Header Text Section */}
      <div className="flex flex-col space-y-1 mx-auto w-full max-w-5xl">
        <h1 className="text-2xl font-bold tracking-tight">Payment Providers</h1>
        <p className="text-muted-foreground text-sm">
          Manage how your customers pay at checkout.
        </p>
      </div>
      
      {/* List Component (Contains Repair Button inside) */}
      <div className="mx-auto w-full max-w-5xl">
        <Payment_Methods_List initialMethods={methods || []} />
      </div>
    </div>
  )
}