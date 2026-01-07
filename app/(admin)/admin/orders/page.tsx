// File Location: app/admin/orders/page.tsx
import { getOrders } from "@/app/actions/admin/order/get-orders"; 
import { OrderListTable } from "./_components/order-list-table";
import { OrdersHeader } from "./_components/header"; // ✅ নতুন ইম্পোর্ট

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    query?: string;
    status?: string;
  }>;
}

export default async function OrdersPage(props: OrdersPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const query = searchParams.query || "";
  const status = searchParams.status || "all";

  // Data Fetching
  const { data: orders, meta } = await getOrders(page, 20, status, query);

  return (
    <div className="p-4 md:p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F8F9FA]">
      
      {/* ✅ Clean Header Component with Dropdown */}
      <OrdersHeader counts={meta?.counts || {}} />

      {/* Orders Table */}
      <OrderListTable 
        orders={orders || []} 
        isTrashView={status === 'trash'} 
      />

      {/* Pagination Logic (Simple Version) */}
      {/* (আপনি চাইলে পেজিনেশনও আলাদা কম্পোনেন্টে নিতে পারেন, তবে এখানে রাখলেও সমস্যা নেই) */}
      {meta && meta.pages > 1 && (
        <div className="mt-6 flex justify-end gap-2">
            {/* Pagination Buttons logic goes here (same as before) */}
            {/* আপনার আগের পেজিনেশন কোডটি এখানে থাকবে */}
        </div>
      )}

    </div>
  );
}