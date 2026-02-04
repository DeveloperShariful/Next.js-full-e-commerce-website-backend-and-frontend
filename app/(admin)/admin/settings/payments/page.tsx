// app/admin/settings/payments/page.tsx
import { getAllPaymentMethods } from "@/app/actions/admin/settings/payments/payments-dashboard"
import { Payment_Header } from "./_components/Payment_Header"
import { Payment_Methods_List } from "./_components/Payment_Methods_List"

export default async function PaymentSettingsPage() {
  const { data: methods } = await getAllPaymentMethods()

  return (
    <div className="flex flex-col gap-6 p-6">
      <Payment_Header />
      
      {/* We pass the initial data to the list component */}
      <div className="mx-auto w-full max-w-5xl">
        <Payment_Methods_List initialMethods={methods || []} />
      </div>
    </div>
  )
}