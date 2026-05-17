// File Location: app/admin/orders/[orderId]/invoice/page.tsx

import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { InvoiceView } from "./_components/invoice-view";

const serializeData = (data: any) => {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && value.toString && value.constructor.name === 'Decimal') {
      return Number(value);
    }
    return value;
  }));
};

export default async function InvoicePage(props: { params: Promise<{ orderId: string }> }) {
  const params = await props.params;

  const rawOrder = await db.order.findUnique({
    where: { id: params.orderId },
    include: { items: true, user: true }
  });

  const rawSettings = await db.storeSettings.findUnique({ where: { id: "settings" } });

  if (!rawOrder) return notFound();

  const order = serializeData(rawOrder);
  const settings = serializeData(rawSettings);

  return <InvoiceView order={order} settings={settings} />;
}