// File Location: app/admin/orders/_components/order-list-table.tsx

"use client"

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, ShoppingCart, CheckSquare, Printer, Box, X, Trash2, RefreshCcw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { bulkUpdateOrderStatus } from "@/app/actions/admin/order/bulk-update";
import { deleteOrder } from "@/app/actions/admin/order/delete-order";
import { restoreOrder } from "@/app/actions/admin/order/restore-order";
import { useGlobalStore } from "@/app/providers/global-store-provider"; // ✅ Global Import

interface OrderListTableProps {
  orders: any[];
  isTrashView?: boolean;
}

export const OrderListTable = ({ orders, isTrashView = false }: OrderListTableProps) => {
  const { formatPrice } = useGlobalStore(); // ✅ Use Global Formatter
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // --- Selection Logic ---
  const toggleSelect = (id: string) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(prev => prev.filter(oid => oid !== id));
    } else {
      setSelectedOrders(prev => [...prev, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.id));
    }
  };

  // --- Actions ---
  const handleBulkStatus = (status: any) => {
    startTransition(async () => {
        const res = await bulkUpdateOrderStatus(selectedOrders, status);
        if(res.success) {
            toast.success(res.message);
            setSelectedOrders([]);
        } else {
            toast.error(res.error);
        }
    });
  };

  const handleRestore = async (id: string) => {
      startTransition(async () => {
          const res = await restoreOrder(id);
          if(res.success) toast.success(res.message);
          else toast.error(res.error);
      });
  };

  const handleDelete = async (id: string) => {
      if (isTrashView && !confirm("Permanently delete this order? This CANNOT be undone.")) return;
      startTransition(async () => {
          const res = await deleteOrder(id, isTrashView);
          if(res.success) toast.success(res.message);
          else toast.error(res.error);
      });
  };

  const handleBulkDelete = () => {
      const msg = isTrashView 
        ? "Permanently delete selected orders? This is irreversible." 
        : "Move selected orders to trash?";
      if(!confirm(msg)) return;

      startTransition(async () => {
          const promises = selectedOrders.map(id => deleteOrder(id, isTrashView));
          await Promise.all(promises);
          toast.success(isTrashView ? "Orders permanently deleted" : "Orders moved to trash");
          setSelectedOrders([]);
      });
  };

  // --- UI Helpers ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200";
      case 'PROCESSING': return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200";
      case 'SHIPPED': return "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200";
      case 'DELIVERED': return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200";
      case 'CANCELLED': return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-slate-200 border-dashed text-slate-400">
        <ShoppingCart size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium text-slate-600">No orders found</p>
        <p className="text-sm">Try changing your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="relative">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                <th className="px-6 py-4 w-10">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        checked={selectedOrders.length === orders.length && orders.length > 0}
                        onChange={toggleSelectAll}
                    />
                </th>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Items</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                <tr key={order.id} className={`hover:bg-slate-50/80 transition-colors group ${selectedOrders.includes(order.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-4">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => toggleSelect(order.id)}
                        />
                    </td>
                    <td className="px-6 py-4">
                        {isTrashView ? (
                            <span className="font-bold text-slate-400 line-through">#{order.orderNumber}</span>
                        ) : (
                            <Link href={`/admin/orders/${order.id}`} className="font-bold text-blue-600 hover:underline">
                                #{order.orderNumber}
                            </Link>
                        )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{order.user?.name || "Guest"}</div>
                        <div className="text-xs text-slate-500">{order.user?.email || order.guestEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                        {isTrashView ? (
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">DELETED</Badge>
                        ) : (
                            <Badge variant="outline" className={getStatusColor(order.status)}>{order.status.replace(/_/g, " ")}</Badge>
                        )}
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{order._count.items}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                        {/* ✅ Using Global Formatter */}
                        {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {!isTrashView && (
                            <Link href={`/admin/orders/${order.id}`}>
                                <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                            </Link>
                        )}
                        {isTrashView && (
                            <DropdownMenuItem onClick={() => handleRestore(order.id)} className="text-blue-600">
                                <RefreshCcw className="mr-2 h-4 w-4" /> Restore
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(order.id)} className="text-red-600 focus:text-red-600">
                            {isTrashView ? <><AlertTriangle className="mr-2 h-4 w-4"/> Delete Forever</> : <><Trash2 className="mr-2 h-4 w-4" /> Move to Trash</>}
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </div>

        {selectedOrders.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 border-r border-slate-700 pr-6">
                    <div className="bg-blue-600 text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center">{selectedOrders.length}</div>
                    <span className="text-sm font-medium">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    {!isTrashView ? (
                        <>
                            <Button size="sm" variant="ghost" className="text-white hover:bg-slate-800" onClick={() => handleBulkStatus("PROCESSING")}><Box size={16}/> Processing</Button>
                            <Button size="sm" variant="ghost" className="text-white hover:bg-slate-800" onClick={() => handleBulkStatus("SHIPPED")}><CheckSquare size={16}/> Shipped</Button>
                        </>
                    ) : null}
                    <Button size="sm" variant="ghost" className="text-red-400 hover:bg-slate-800 hover:text-red-300 gap-2" onClick={handleBulkDelete} disabled={isPending}>
                        {isTrashView ? <AlertTriangle size={16}/> : <Trash2 size={16}/>}
                        {isTrashView ? "Delete Forever" : "Trash"}
                    </Button>
                </div>
                <button onClick={() => setSelectedOrders([])} className="ml-2 hover:bg-slate-800 p-1 rounded-full"><X size={16}/></button>
            </div>
        )}
    </div>
  );
};