// app/admin/customers/page.tsx

import { getCustomers } from "@/app/actions/admin/customer";
import { CustomerHeader } from "./_components/customer-header";
import { CustomerTable } from "./_components/customer-table";
import { Search } from "lucide-react";

// Next.js 15 Interface
interface CustomersPageProps {
  searchParams: Promise<{
    page?: string;
    query?: string;
  }>;
}

export default async function CustomersPage(props: CustomersPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const query = searchParams.query || "";

  // Data Fetching
  const { data: customers, meta } = await getCustomers(page, 20, query);

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      <CustomerHeader />

      {/* TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="text-sm text-slate-500 font-medium ml-2">
           Total Customers: <span className="text-slate-900 font-bold">{meta?.total || 0}</span>
        </div>
        
        <form className="relative group">
           <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500" size={16} />
           <input 
             name="query" 
             defaultValue={query} 
             placeholder="Search name, email..." 
             className="h-9 pl-9 pr-4 w-64 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
           />
        </form>
      </div>

      <CustomerTable 
        data={customers || []} 
        page={page} 
        meta={meta || { total: 0, pages: 1 }} 
      />
    </div>
  );
}