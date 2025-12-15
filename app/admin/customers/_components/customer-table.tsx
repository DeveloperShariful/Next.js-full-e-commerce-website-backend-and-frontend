"use client";

import { useState } from 'react';
import { Mail, MapPin, Trash2, X } from 'lucide-react';
import { CustomerActions } from './customer-actions';
import { CustomerDetails } from './customer-details';
import { bulkDeleteCustomers } from "@/app/actions/customer";
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface CustomerTableProps {
  data: any[];
  page: number;
  meta: { total: number; pages: number };
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (date: Date | null) => {
  if (!date) return "Never";
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
};

export function CustomerTable({ data, page, meta }: CustomerTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewCustomerId, setViewCustomerId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- SELECTION LOGIC ---
  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} customers?`)) return;
    
    setIsDeleting(true);
    const toastId = toast.loading("Deleting...");
    const res = await bulkDeleteCustomers(selectedIds);
    setIsDeleting(false);

    if (res.success) {
      toast.success(res.message, { id: toastId });
      setSelectedIds([]);
    } else {
      toast.error(res.message, { id: toastId });
    }
  };

  return (
    <>
      {/* BULK ACTION HEADER (Shows when items selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
           <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{selectedIds.length}</span>
              <span className="text-sm text-blue-800 font-medium">customers selected</span>
           </div>
           <div className="flex gap-2">
              <button onClick={() => setSelectedIds([])} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-white rounded border border-transparent hover:border-slate-200 transition">Cancel</button>
              <button 
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded hover:bg-red-700 transition flex items-center gap-1 shadow-sm disabled:opacity-50"
              >
                <Trash2 size={14}/> {isDeleting ? "Deleting..." : "Delete Selected"}
              </button>
           </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-400 cursor-pointer"
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4">Customer</th>
                <th className="p-4">Location</th>
                <th className="p-4 text-center">Orders</th>
                <th className="p-4 text-right">Total Spent</th>
                <th className="p-4 text-center">Last Order</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr><td colSpan={8} className="p-16 text-center text-slate-500">No customers found.</td></tr>
              ) : (
                data.map((customer, i) => (
                  <tr 
                    key={customer.id} 
                    className={`
                      transition group cursor-pointer 
                      ${selectedIds.includes(customer.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50'}
                    `}
                    onClick={() => setViewCustomerId(customer.id)} // Open Drawer on Row Click
                  >
                    {/* Checkbox (Stop Propagation to prevent opening drawer) */}
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 cursor-pointer" 
                        checked={selectedIds.includes(customer.id)}
                        onChange={() => toggleSelect(customer.id)}
                      />
                    </td>
                    
                    <td className="p-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm overflow-hidden border border-slate-200">
                             {customer.image ? <img src={customer.image} alt="" className="w-full h-full object-cover" /> : customer.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                             <div className="font-bold text-slate-800">{customer.name || "Guest"}</div>
                             <div className="text-xs text-slate-500 flex items-center gap-1"><Mail size={10}/> {customer.email}</div>
                          </div>
                       </div>
                    </td>

                    <td className="p-4 text-slate-600 text-xs">
                       {customer.addresses?.[0] ? <div className="flex items-center gap-1"><MapPin size={12}/> {customer.addresses[0].city}</div> : <span className="text-slate-400">–</span>}
                    </td>

                    <td className="p-4 text-center">
                       <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border border-slate-200">{customer.stats.orderCount}</span>
                    </td>

                    <td className="p-4 text-right font-bold text-slate-700">
                       {formatPrice(customer.stats.totalSpent)}
                    </td>

                    <td className="p-4 text-center text-xs text-slate-500">
                       {formatDate(customer.stats.lastOrderDate)}
                    </td>

                    <td className="p-4 text-center">
                       <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${customer.isActive ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                          {customer.isActive ? "Active" : "Blocked"}
                       </span>
                    </td>

                    {/* Actions (Stop Propagation) */}
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                       <CustomerActions id={customer.id} isActive={customer.isActive} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 border-t border-slate-200 bg-gray-50 flex justify-between items-center text-xs text-slate-500">
           <span>Showing {data.length} of {meta.total} customers</span>
           <div className="flex gap-1">
              <Link 
                 href={`/admin/customers?page=${Math.max(1, page - 1)}`} 
                 className={`px-3 py-1 border border-slate-300 bg-white rounded hover:bg-slate-100 ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
              >
                 Previous
              </Link>
              <span className="px-3 py-1 border border-slate-300 bg-white rounded font-bold">{page}</span>
              <Link 
                 href={`/admin/customers?page=${Math.min(meta.pages, page + 1)}`} 
                 className={`px-3 py-1 border border-slate-300 bg-white rounded hover:bg-slate-100 ${page >= meta.pages ? 'pointer-events-none opacity-50' : ''}`}
              >
                 Next
              </Link>
           </div>
        </div>
      </div>

      {/* CUSTOMER DETAILS DRAWER */}
      {viewCustomerId && (
        <CustomerDetails 
          customerId={viewCustomerId} 
          onClose={() => setViewCustomerId(null)} 
        />
      )}
    </>
  );
}