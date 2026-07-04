// File Location: app/admin/orders/[orderId]/page.tsx

import { getOrderDetails } from "@/app/actions/backend/order/get-orders";
import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStoreTimezone } from "@/lib/get-store-timezone";

// --- WOOCOMMERCE STYLE META BOX COMPONENTS ---
import { OrderDetailsMeta } from "./_components/order-details-meta";
import { OrderIssuesMeta } from "./_components/order-issues-meta";
import { OrderItemsMeta } from "./_components/order-items-meta";
import { OrderShipmentsMeta } from "./_components/order-shipments-meta";
import { OrderRefundsMeta } from "./_components/order-refunds-meta";
import { OrderTransactionsMeta } from "./_components/order-transactions-meta";
import { CustomerHistoryMeta } from "./_components/customer-history-meta";
import { CustomFieldsMeta } from "./_components/custom-fields-meta";
import { DownloadablePermissionsMeta } from "./_components/downloadable-permissions-meta";

import { OrderSidebarActions } from "./_components/order-sidebar-actions";
import { TransdirectSidebar } from "./_components/transdirect-booking";
import { OrderSidebarNotes } from "./_components/order-sidebar-notes";
import { SecuritySidebar } from "./_components/security-risk";
import { AffiliateSidebar } from "./_components/affiliate-sidebar";

// ✅ Import Strict Types
import { OrderDetailsType, CustomerHistoryType, CustomerHistoryOrderItem } from "./types";
import { BackButton } from "@/app/(backend)/admin/_components/back-button";

export default async function OrderDetailsPage(props: { params: Promise<{ orderId: string }> }) {
  const params = await props.params;
  
  // ১. Fetch Order Data
  const { data: rawOrder } = await getOrderDetails(params.orderId);
  if (!rawOrder) return notFound();

  // ✅ Serialize and Cast to Strict Type
  const order: OrderDetailsType = JSON.parse(JSON.stringify(rawOrder));
  const timezone = await getStoreTimezone();

  // ২. Customer History Calculation
  let customerHistory: CustomerHistoryType = { totalOrders: 0, totalRevenue: 0, avgValue: 0, orders: [] };

  if (order.userId || order.guestEmail) {
      const pastOrders = await db.order.findMany({
          where: {
              OR: [
                  { userId: order.userId || undefined },
                  { guestEmail: order.guestEmail || undefined }
              ],
              status: { notIn: ['CANCELLED', 'FAILED'] },
              deletedAt: null
          },
          select: { id: true, orderNumber: true, total: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
      });

      const orders: CustomerHistoryOrderItem[] = pastOrders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber || '',
          total: Number(o.total),
          status: o.status,
          createdAt: o.createdAt.toISOString()
      }));

      const tOrders = orders.length;
      const tRevenue = orders.reduce((sum, o) => sum + o.total, 0);

      customerHistory = {
          totalOrders: tOrders,
          totalRevenue: tRevenue,
          avgValue: tOrders > 0 ? tRevenue / tOrders : 0,
          orders
      };
  }

  return (
    <div className="max-w-[100%] mx-auto min-h-screen bg-[#f0f0f1] text-[#3c434a] font-sans pb-20">

      <div className="mb-2">
        <BackButton storageKey="orders-return-url" fallbackUrl="/admin/orders" label="Back to orders" />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-[23px] font-normal text-[#1d2327] m-0 leading-none">
            Edit order
        </h1>
        <Link
            href="/admin/orders/create"
            className="border border-[#2271b1] text-[#2271b1] hover:bg-[#f6f7f7] hover:text-[#135e96] hover:border-[#135e96] transition-colors px-2.5 py-0.5 text-[13px] rounded-[3px] font-medium ml-2 shadow-sm"
        >
            Add new order
        </Link>
      </div>

      {/* Order Actions — mobile only, always at top */}
      <div className="block lg:hidden mb-5">
        <OrderSidebarActions order={order} />
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start w-full">

        {/* === LEFT COLUMN === */}
        <div className="w-full lg:w-[70%] xl:w-[82%] space-y-5">
          <OrderDetailsMeta order={order} timezone={timezone} />
          <OrderIssuesMeta order={order} />
          <OrderItemsMeta order={order} timezone={timezone} />
          <OrderShipmentsMeta shipments={order.shipments} timezone={timezone} />
          <OrderRefundsMeta refunds={order.refunds} timezone={timezone} />
          <OrderTransactionsMeta transactions={order.transactions} timezone={timezone} />
          <CustomerHistoryMeta history={customerHistory} />
          <CustomFieldsMeta order={order} />
          <DownloadablePermissionsMeta order={order} />
        </div>

        {/* === RIGHT COLUMN === */}
        <div className="w-full lg:w-[30%] xl:w-[18%] space-y-5">
            {/* Order Actions — desktop only, in sidebar */}
            <div className="hidden lg:block">
              <OrderSidebarActions order={order} />
            </div>
            <TransdirectSidebar order={order} />
            <OrderSidebarNotes order={order} timezone={timezone} />
            <SecuritySidebar order={order} />
            <AffiliateSidebar order={order} />
        </div>
      </div>

    </div>
  );
}