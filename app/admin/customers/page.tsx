// app/admin/customers/page.tsx

import Link from 'next/link';
import { getCustomers, deleteCustomer, toggleCustomerStatus } from "@/app/actions/customer";
import { 
  Search, Trash2, Mail, MapPin, MoreHorizontal, 
  User as UserIcon, Ban, CheckCircle, RefreshCcw
} from 'lucide-react';

// Next.js 15 Interface
interface CustomersPageProps {
  searchParams: Promise<{
    page?: string;
    query?: string;
  }>;
}

// Helpers
const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency', currency: 'BDT', minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (date: Date | null) => {
  if (!date) return "Never";
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  }).format(new Date(date));
};

export default async function CustomersPage(props: CustomersPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const query = searchParams.query || "";

  // Data Fetching
  const { data: customers, meta } = await getCustomers(page, 20, query);

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserIcon className="text-blue-600" /> Customers
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage your store's customer base and view their purchase history.</p>
        </div>
        <div className="flex gap-2">
           <button className="px-3 py-1.5 text-sm font-medium border border-slate-400 rounded bg-white text-slate-700 hover:bg-slate-50">Export</button>
           <button className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm">Add Customer</button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center">
           <div className="text-sm text-slate-500 font-medium">
              Total Customers: <span className="text-slate-900 font-bold">{meta?.total || 0}</span>
           </div>
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

      {/* TABLE */}
      <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
              <tr>
                <th className="p-4 w-10 text-center"><input type="checkbox" className="rounded border-slate-400" /></th>
                <th className="p-4">Name</th>
                <th className="p-4">Location</th>
                <th className="p-4 text-center">Orders</th>
                <th className="p-4 text-right">Total Spent</th>
                <th className="p-4 text-right">AOV</th>
                <th className="p-4 text-center">Last Active</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!customers || customers.length === 0) ? (
                <tr>
                  <td colSpan={9} className="p-16 text-center text-slate-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-blue-50/30 transition group">
                    <td className="p-4 text-center"><input type="checkbox" className="rounded border-slate-300" /></td>
                    
                    {/* Name & Avatar */}
                    <td className="p-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm overflow-hidden">
                             {customer.image ? (
                                <img src={customer.image} alt="" className="w-full h-full object-cover" />
                             ) : (
                                customer.name ? customer.name.charAt(0).toUpperCase() : "U"
                             )}
                          </div>
                          <div>
                             <div className="font-bold text-slate-800">{customer.name || "Unknown User"}</div>
                             <div className="text-xs text-slate-500 flex items-center gap-1">
                                <Mail size={10}/> {customer.email}
                             </div>
                          </div>
                       </div>
                    </td>

                    {/* Location */}
                    <td className="p-4 text-slate-600 text-xs">
                       {customer.addresses && customer.addresses.length > 0 ? (
                          <div className="flex items-center gap-1">
                             <MapPin size={12}/> {customer.addresses[0].city}, {customer.addresses[0].country}
                          </div>
                       ) : <span className="text-slate-400">–</span>}
                    </td>

                    {/* Orders Count */}
                    <td className="p-4 text-center">
                       <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                         {customer.stats.orderCount}
                       </span>
                    </td>

                    {/* Total Spent */}
                    <td className="p-4 text-right font-bold text-slate-700">
                       {formatPrice(customer.stats.totalSpent)}
                    </td>

                    {/* AOV */}
                    <td className="p-4 text-right text-slate-500 text-xs">
                       {formatPrice(customer.stats.aov)}
                    </td>

                    {/* Last Active */}
                    <td className="p-4 text-center text-xs text-slate-500">
                       {formatDate(customer.stats.lastOrderDate)}
                    </td>

                    {/* Status */}
                    <td className="p-4 text-center">
                       {customer.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                             Active
                          </span>
                       ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                             Blocked
                          </span>
                       )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          
                          {/* Toggle Status Form */}
                          <form action={async () => { 'use server'; await toggleCustomerStatus(customer.id, !customer.isActive) }}>
                             <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition" title={customer.isActive ? "Block" : "Unblock"}>
                                {customer.isActive ? <Ban size={16} className="text-orange-500"/> : <CheckCircle size={16} className="text-green-600"/>}
                             </button>
                          </form>

                          {/* Delete Form */}
                          <form action={async () => { 'use server'; await deleteCustomer(customer.id) }}>
                             <button className="p-2 text-red-600 hover:bg-red-50 rounded-md transition" title="Delete User">
                                <Trash2 size={16} />
                             </button>
                          </form>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 border-t border-slate-200 bg-gray-50 flex justify-between items-center text-xs text-slate-500">
           <span>Showing {customers ? customers.length : 0} customers</span>
           <div className="flex gap-1">
              <Link 
                 href={`/admin/customers?page=${page > 1 ? page - 1 : 1}`} 
                 className={`px-3 py-1 border border-slate-300 bg-white rounded hover:bg-slate-100 ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
              >
                 Previous
              </Link>
              <span className="px-3 py-1 border border-slate-300 bg-white rounded font-bold">{page}</span>
              <Link 
                 href={`/admin/customers?page=${page < (meta?.pages || 1) ? page + 1 : (meta?.pages || 1)}`} 
                 className={`px-3 py-1 border border-slate-300 bg-white rounded hover:bg-slate-100 ${page >= (meta?.pages || 1) ? 'pointer-events-none opacity-50' : ''}`}
              >
                 Next
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}