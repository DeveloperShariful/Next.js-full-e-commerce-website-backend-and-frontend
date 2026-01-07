// File Location: app/admin/orders/_components/order-list-table.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, MoreHorizontal, ShoppingCart, CheckSquare, 
  Box, X, Trash2, RefreshCcw, AlertTriangle, Loader2 
} from "lucide-react";
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
// ✅ FIX: Switched back to react-hot-toast (matches your product page)
import { toast } from "react-hot-toast"; 
import { bulkUpdateOrderStatus } from "@/app/actions/admin/order/bulk-update";
import { deleteOrder } from "@/app/actions/admin/order/delete-order";
import { restoreOrder } from "@/app/actions/admin/order/restore-order";
import { useGlobalStore } from "@/app/providers/global-store-provider";

interface OrderListTableProps {
  orders: any[];
  isTrashView?: boolean;
}

export const OrderListTable = ({ orders, isTrashView = false }: OrderListTableProps) => {
  const router = useRouter();
  const { formatPrice } = useGlobalStore(); 
  
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  
  // Specific Loading States
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [bulkLoadingAction, setBulkLoadingAction] = useState<string | null>(null);

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

  // --- Bulk Actions (FIXED) ---
  const handleBulkStatus = (status: string) => {
    setBulkLoadingAction(status); // Start Loading
    
    startTransition(async () => {
        try {
            const res = await bulkUpdateOrderStatus(selectedOrders, status as any);
            
            if(res.success) {
                toast.success(res.message || "Orders updated successfully");
                setSelectedOrders([]);
                router.refresh();
            } else {
                toast.error(res.error || "Update failed");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            // ✅ FIX: Stop Loading
            setBulkLoadingAction(null);
        }
    });
  };

  const handleBulkDelete = () => {
      const msg = isTrashView 
        ? "Permanently delete selected orders? This is irreversible." 
        : "Move selected orders to trash?";
      
      if(!confirm(msg)) return;

      setBulkLoadingAction("DELETE"); // Start Loading

      startTransition(async () => {
          try {
              await Promise.all(selectedOrders.map(id => deleteOrder(id, isTrashView)));
              
              toast.success(isTrashView ? "Orders deleted permanently" : "Orders moved to trash");
              setSelectedOrders([]);
              router.refresh();
          } catch (error) {
              toast.error("Bulk action failed");
          } finally {
              // ✅ FIX: Stop Loading
              setBulkLoadingAction(null);
          }
      });
  };

  // --- Single Actions (FIXED) ---
  const handleSingleAction = (id: string, action: 'restore' | 'delete' | 'trash') => {
      setLoadingId(id); // Start Loading Specific Row
      
      startTransition(async () => {
          try {
              let res;
              if (action === 'restore') res = await restoreOrder(id);
              else if (action === 'trash') res = await deleteOrder(id, false); 
              else if (action === 'delete') res = await deleteOrder(id, true);

              if(res?.success) {
                  toast.success(res.message || "Action successful");
                  router.refresh();
              } else {
                  toast.error(res?.error || "Action failed");
              }
          } catch (error) {
              toast.error("An error occurred");
          } finally {
              // ✅ FIX: Stop Loading
              setLoadingId(null);
          }
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
      case 'REFUNDED': return "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200";
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
    <div className="relative pb-20">
        {/* Table Container */}
        <div className={`bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm transition-opacity duration-200 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                <th className="px-6 py-4 w-10">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer accent-blue-600"
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
                {orders.map((order) => {
                    const isProcessingThis = loadingId === order.id;
                    
                    return (
                    <tr key={order.id} className={`hover:bg-slate-50/80 transition-colors group ${selectedOrders.includes(order.id) ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-6 py-4">
                            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer accent-blue-600"
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
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                            {format(new Date(order.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">{order.user?.name || "Guest"}</div>
                            <div className="text-xs text-slate-500 truncate max-w-[150px]" title={order.user?.email || order.guestEmail}>
                                {order.user?.email || order.guestEmail}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            {isTrashView ? (
                                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">DELETED</Badge>
                            ) : (
                                <Badge variant="outline" className={getStatusColor(order.status)}>{order.status.replace(/_/g, " ")}</Badge>
                            )}
                        </td>
                        <td className="px-6 py-4 text-center">
                            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">{order._count.items}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900 whitespace-nowrap">
                            {/* ✅ Currency Formatting Check */}
                            {formatPrice(order.total)}
                        </td>
                        <td className="px-6 py-4 text-right">
                            {isProcessingThis ? (
                                <div className="flex justify-end pr-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                </div>
                            ) : (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-200 rounded-full transition-all">
                                            <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 shadow-lg border-slate-200">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        
                                        {!isTrashView && (
                                            <>
                                                <Link href={`/admin/orders/${order.id}`}>
                                                    <DropdownMenuItem className="cursor-pointer">
                                                        <Eye className="mr-2 h-4 w-4 text-slate-500" /> View Details
                                                    </DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuItem onClick={() => handleSingleAction(order.id, 'trash')} className="text-red-600 focus:text-red-600 cursor-pointer focus:bg-red-50">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Move to Trash
                                                </DropdownMenuItem>
                                            </>
                                        )}

                                        {isTrashView && (
                                            <>
                                                <DropdownMenuItem onClick={() => handleSingleAction(order.id, 'restore')} className="text-blue-600 focus:text-blue-600 cursor-pointer focus:bg-blue-50">
                                                    <RefreshCcw className="mr-2 h-4 w-4" /> Restore Order
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleSingleAction(order.id, 'delete')} className="text-red-600 focus:text-red-600 cursor-pointer focus:bg-red-50">
                                                    <AlertTriangle className="mr-2 h-4 w-4" /> Delete Forever
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </td>
                    </tr>
                    );
                })}
            </tbody>
            </table>
        </div>
        </div>

        {/* Floating Bulk Actions Bar */}
        {selectedOrders.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-4 border border-slate-700">
                <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
                    <div className="bg-blue-600 text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center shadow-sm">{selectedOrders.length}</div>
                    <span className="text-sm font-medium">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    {!isTrashView ? (
                        <>
                            <Button 
                                size="sm" variant="ghost" 
                                className="text-white hover:bg-slate-800 h-8 text-xs transition-colors" 
                                onClick={() => handleBulkStatus("PROCESSING")}
                                disabled={isPending}
                            >
                                {/* ✅ Specific Spinner Logic */}
                                {bulkLoadingAction === 'PROCESSING' ? <Loader2 size={14} className="mr-2 animate-spin"/> : <Box size={14} className="mr-2"/>}
                                Mark Processing
                            </Button>
                            <Button 
                                size="sm" variant="ghost" 
                                className="text-white hover:bg-slate-800 h-8 text-xs transition-colors" 
                                onClick={() => handleBulkStatus("SHIPPED")}
                                disabled={isPending}
                            >
                                {bulkLoadingAction === 'SHIPPED' ? <Loader2 size={14} className="mr-2 animate-spin"/> : <CheckSquare size={14} className="mr-2"/>}
                                Mark Shipped
                            </Button>
                        </>
                    ) : null}
                    
                    <Button 
                        size="sm" variant="ghost" 
                        className="text-red-400 hover:bg-red-900/30 hover:text-red-300 h-8 text-xs gap-2 ml-2 transition-colors" 
                        onClick={handleBulkDelete} 
                        disabled={isPending}
                    >
                        {bulkLoadingAction === 'DELETE' ? <Loader2 size={14} className="animate-spin"/> : (isTrashView ? <AlertTriangle size={14}/> : <Trash2 size={14}/>)}
                        {isTrashView ? "Delete Forever" : "Trash"}
                    </Button>
                </div>
                <button onClick={() => setSelectedOrders([])} className="ml-2 hover:bg-slate-800 p-1.5 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X size={16}/>
                </button>
            </div>
        )}
    </div>
  );
};