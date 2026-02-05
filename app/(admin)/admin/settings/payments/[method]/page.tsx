//File: app/admin/settings/payments/[method]/page.tsx

import { notFound } from "next/navigation"
import { getPaymentMethodByIdentifier } from "@/app/actions/admin/settings/payments/payments-dashboard"
import { PaymentConfigUI } from "./_components/PaymentConfigUI"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ method: string }>
}

export default async function PaymentMethodPage({ params }: PageProps) {
  const { method } = await params;
  const { success, data: config } = await getPaymentMethodByIdentifier(method)

  if (!success || !config) {
    return notFound()
  }

  return <PaymentConfigUI method={config} />
}