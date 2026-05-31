//File 7: app/admin/settings/payments/[identifier]/page.tsx

import { notFound } from "next/navigation"
import { getAllPaymentGateways } from "@/app/actions/backend/settings/payments/core-actions"
import { PaymentConfigUI } from "./_components/PaymentConfigUI"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ identifier: string }>
}

export default async function PaymentMethodPage({ params }: PageProps) {
  const { identifier } = await params;
  
  const { success, data } = await getAllPaymentGateways();

  if (!success || !data) {
    return notFound();
  }

  const config = data.find(m => m.identifier === identifier);

  if (!config) {
    return notFound();
  }

  return <PaymentConfigUI method={config} />
}