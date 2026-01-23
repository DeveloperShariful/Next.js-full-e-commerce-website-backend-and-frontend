// File: app/admin/orders/[orderId]/page.tsx
import { getOrderDetails } from "@/app/actions/admin/order/get-order-details"; 
import { notFound } from "next/navigation";

// --- COMPONENTS ---
import { OrderHeader } from "./_components/order-header";
import { OrderItemsTable } from "./_components/order-items-table";
import { CustomerInfo } from "./_components/customer-info";
import { PaymentFulfillment } from "./_components/payment-fulfillment";
import { NotesTimeline } from "./_components/notes-timeline";
import { CustomerNote } from "./_components/customer-note"; 
import { SecurityRisk } from "./_components/security-risk"; 
import { TransactionHistory } from "./_components/transaction-history"; 
import { TransdirectBooking } from "./_components/transdirect-booking"; 
import { OrderActions } from "./_components/order-actions";
import { EmailLogs } from "./_components/email-logs"; 

export default async function OrderDetailsPage(props: { params: Promise<{ orderId: string }> }) {
  const params = await props.params;
  
  // ১. ডাটা ফেচ করা
  const { data: rawOrder } = await getOrderDetails(params.orderId);

  if (!rawOrder) return notFound();

  // ✅ FIX: এখানে সরাসরি ডাটাকে প্লেইন অবজেক্টে কনভার্ট করা হলো
  // এটি Prisma-র Decimal এবং Date অবজেক্টগুলোকে স্ট্রিং/নাম্বারে ভেঙে ফেলবে
  const order = JSON.parse(JSON.stringify(rawOrder));

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen bg-[#F8F9FA] pb-20">
      
      {/* Header Section */}
      <OrderHeader order={order} />

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* === LEFT COLUMN (Main Content) === */}
        <div className="xl:col-span-2 space-y-6">
          <CustomerNote note={order.customerNote} />
          <OrderItemsTable order={order} />
          <TransactionHistory order={order} />
          <PaymentFulfillment order={order} />
          
          {/* Mobile Only: Logs & Timeline */}
          <div className="block xl:hidden">
             <EmailLogs orderId={order.id} />
          </div>
          
          <div className="block xl:hidden">
             <NotesTimeline order={order} />
          </div>
        </div>

        {/* === RIGHT COLUMN (Sidebar) === */}
        <div className="flex flex-col gap-6 h-full">
            
            {/* ✅ ORDER ACTIONS */}
            <div className="order-last xl:order-first">
                <OrderActions order={order} />
            </div>

            {/* Other Components */}
            <TransdirectBooking order={order} />
            
            <SecurityRisk order={order} />
            
            <CustomerInfo order={order} />
            
            <div className="hidden xl:block">
                <EmailLogs orderId={order.id} />
            </div>

            <div className="hidden xl:block h-auto">
                <NotesTimeline order={order} />
            </div>

        </div>
      </div>
    </div>
  );
}