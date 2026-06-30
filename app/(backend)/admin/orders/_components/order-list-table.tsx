// File Location: app/admin/orders/_components/order-list-table.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isToday, formatDistanceToNow } from "date-fns";
import { formatTz } from "@/lib/store-time";
import { toast } from "sonner"; 
import { Eye, Check, Loader2, Trash2, RefreshCcw, AlertTriangle, Truck } from "lucide-react";
import { bulkUpdateOrderStatus, deleteOrder, restoreOrder } from "@/app/actions/backend/order/bulk-update";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import type { OrderStatus } from "@prisma/client";

interface OrderAddress {
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface SerializedOrder {
  id: string;
  orderNumber: string;
  createdAt: string | Date;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  paymentGateway: string | null;
  paymentMethod: string | null;
  shippingMethod: string | null;
  shippingTrackingNumber: string | null;
  shippingTrackingUrl: string | null;
  transdirectBookingId: string | null;
  billingAddress: OrderAddress | null;
  shippingAddress: OrderAddress | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referringSite: string | null;
  total: number;
  refundedAmount: number;
  deletedAt: string | Date | null;
  user: { name: string | null; email: string | null } | null;
  affiliate: { user: { name: string | null } } | null;
  _count: { items: number };
}

interface OrderListTableProps {
  orders: SerializedOrder[];
  isTrashView?: boolean;
  timezone?: string;
}

export const OrderListTable = ({ orders, isTrashView = false, timezone = "UTC" }: OrderListTableProps) => {
  const router = useRouter();
  const { formatPrice } = useGlobalStore(); 
  
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  // 🟢 isPending already existed, we just need to use it in the button
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<string>("");

  const toggleSelect = (id: string) => {
    if (selectedOrders.includes(id)) setSelectedOrders(prev => prev.filter(oid => oid !== id));
    else setSelectedOrders(prev => [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) setSelectedOrders([]);
    else setSelectedOrders(orders.map(o => o.id));
  };

  const handleApplyBulkAction = () => {
    if (!bulkAction) return toast.error("Please select an action");
    if (selectedOrders.length === 0) return toast.error("Please select at least one order");

    if (bulkAction === "trash" || bulkAction === "delete") {
      const msg = bulkAction === "delete" 
        ? "Permanently delete selected orders?" 
        : "Move selected orders to trash?";
      if (!confirm(msg)) return;

      startTransition(async () => {
          try {
              await Promise.all(selectedOrders.map(id => deleteOrder(id, bulkAction === "delete")));
              toast.success("Orders deleted");
              setSelectedOrders([]);
              setBulkAction("");
              router.refresh();
          } catch (error) {
              toast.error("Bulk action failed");
          }
      });
    } else if (bulkAction === "print") {
      if (selectedOrders.length > 50) return toast.error("Max 50 invoices at once.");
      window.open(`/admin/orders/print-batch?ids=${selectedOrders.join(",")}`, "_blank");
      setBulkAction("");
    } else if (bulkAction === "restore") {
      startTransition(async () => {
        try {
          await Promise.all(selectedOrders.map(id => restoreOrder(id)));
          toast.success("Orders restored");
          setSelectedOrders([]);
          setBulkAction("");
          router.refresh();
        } catch {
          toast.error("Bulk restore failed");
        }
      });
    } else {
      startTransition(async () => {
        try {
          const res = await bulkUpdateOrderStatus(selectedOrders, bulkAction as OrderStatus);
          if (res.success) {
            toast.success(res.message);
            setSelectedOrders([]);
            setBulkAction("");
            router.refresh();
          } else toast.error(res.error);
        } catch {
          toast.error("Something went wrong");
        }
      });
    }
  };

  const handleSingleAction = (id: string, action: 'complete' | 'trash' | 'restore' | 'delete') => {
      setLoadingId(id);
      startTransition(async () => {
          try {
              let res;
              if (action === 'complete') res = await bulkUpdateOrderStatus([id], 'DELIVERED');
              else if (action === 'restore') res = await restoreOrder(id);
              else if (action === 'trash') res = await deleteOrder(id, false); 
              else if (action === 'delete') res = await deleteOrder(id, true);

              if (res?.success) {
                  toast.success(res.message);
                  router.refresh();
              } else toast.error(res?.error);
          } catch (error) {
              toast.error("Action failed");
          } finally {
              setLoadingId(null);
          }
      });
  };

  const getStatusBadge = (status: string) => {
    const baseClass = "inline-flex items-center px-[8px] py-[3px] rounded-[3px] font-bold text-[11px] leading-[1] whitespace-nowrap";
    switch (status) {
      case 'PROCESSING': return <span className={`${baseClass} bg-[#c6e1c6] text-[#5b841b]`}>Processing</span>;
      case 'DELIVERED': return <span className={`${baseClass} bg-[#c6e1c6] text-[#5b841b]`}>Completed</span>;
      case 'PENDING': return <span className={`${baseClass} bg-[#e5e5e5] text-[#777]`}>Pending payment</span>;
      case 'CANCELLED': return <span className={`${baseClass} bg-[#eaa4a4] text-[#761919]`}>Cancelled</span>;
      case 'REFUNDED': return <span className={`${baseClass} bg-[#e5e5e5] text-[#777]`}>Refunded</span>;
      case 'FAILED': return <span className={`${baseClass} bg-[#eaa4a4] text-[#761919]`}>Failed</span>;
      default: return <span className={`${baseClass} bg-[#e5e5e5] text-[#777]`}>{status.replace(/_/g, " ")}</span>;
    }
  };

  const formatAddress = (addr: OrderAddress | null | undefined) => {
      if (!addr) return null;
      const name = `${addr.firstName || ''} ${addr.lastName || ''}`.trim();
      const lines = [
          addr.address1,
          addr.address2,
          `${addr.city} ${addr.state} ${addr.postcode}`,
          addr.country !== 'AU' ? addr.country : ''
      ].filter(Boolean);
      
      return (
          <div className="text-[#3c434a] text-[13px]">
              {name && <strong className="text-[#2271b1] hover:text-[#135e96] block mb-0.5">{name}</strong>}
              {lines.map((line, i) => <div key={i}>{line}</div>)}
          </div>
      );
  };

  return (
    <div className={`transition-opacity duration-200 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        
        <div className="flex items-center gap-1 mb-2">
            <select 
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                disabled={isPending}
                className="border border-[#8c8f94] bg-white h-[30px] px-2 text-[13px] text-[#32373c] focus:border-[#2271b1] focus:ring-1 outline-none shadow-sm min-w-[150px] disabled:bg-gray-100"
            >
                <option value="">Bulk actions</option>
                {!isTrashView ? (
                    <>
                        <option value="PROCESSING">Change status to processing</option>
                        <option value="SHIPPED">Change status to shipped</option>
                        <option value="DELIVERED">Change status to completed</option>
                        <option value="print">Print Invoices</option>
                        <option value="trash">Move to trash</option>
                    </>
                ) : (
                    <>
                        <option value="restore">Restore</option>
                        <option value="delete">Delete permanently</option>
                    </>
                )}
            </select>

            <button 
                onClick={handleApplyBulkAction}
                disabled={isPending || !bulkAction}
                className="border border-[#2271b1] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors shadow-sm disabled:opacity-50 disabled:border-[#8c8f94] disabled:text-[#8c8f94] flex items-center gap-1"
            >
                {/* 🔥 FIXED: Show spinner when Bulk Action is running */}
                {isPending && !loadingId ? (
                   <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Applying...</>
                ) : (
                   "Apply"
                )}
            </button>
        </div>

        <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] w-full overflow-x-auto">
            <table className="w-full text-[13px] text-left border-collapse">
                <thead>
                    <tr className="border-b border-[#c3c4c7]">
                        <th className="w-[2.2em] py-2 px-2 text-center font-normal">
                            <input 
                                type="checkbox" 
                                className="border-[#8c8f94] mt-1"
                                checked={selectedOrders.length === orders.length && orders.length > 0}
                                onChange={toggleSelectAll}
                            />
                        </th>
                        <th className="py-2 px-3 font-medium text-[#2c3338]">Order</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338] hidden md:table-cell">Date</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338]">Status</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338] hidden lg:table-cell">Billing</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338] hidden sm:table-cell">Ship to</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338]">Total</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338] text-right">Actions</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338] hidden xl:table-cell">Origin</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f1]">
                    {orders.length === 0 ? (
                        <tr><td colSpan={9} className="py-4 px-3 text-center text-[#646970]">No orders found.</td></tr>
                    ) : (
                        orders.map((order) => {
                            const isProcessingThis = loadingId === order.id;
                            const customerName = order.user?.name || order.shippingAddress?.firstName || "Guest";
                            
                            const orderDate = new Date(order.createdAt);
                            const displayDate = isToday(orderDate)
                                ? `${formatDistanceToNow(orderDate)} ago`
                                : formatTz(orderDate, timezone, "MMM d, yyyy");

                            let originText = 'Direct';
                            if (order.affiliate) {
                              originText = `Affiliate: ${order.affiliate.user?.name || 'Partner'}`;
                            } else if (order.utmSource) {
                              originText = order.utmMedium
                                ? `${order.utmSource} / ${order.utmMedium}`
                                : order.utmSource;
                              if (order.utmCampaign) originText += ` — ${order.utmCampaign}`;
                            } else if (order.referringSite) {
                              try {
                                originText = `Ref: ${new URL(order.referringSite).hostname}`;
                              } catch {
                                originText = `Ref: ${order.referringSite}`;
                              }
                            }

                            const hasTracking = order.shippingTrackingNumber || order.transdirectBookingId;

                            return (
                                <tr key={order.id} className={`hover:bg-[#f6f7f7] ${selectedOrders.includes(order.id) ? 'bg-[#ffffea]' : ''}`}>
                                    <td className="py-3 px-2 text-center align-top">
                                        <input 
                                            type="checkbox" 
                                            className="border-[#8c8f94] mt-1"
                                            checked={selectedOrders.includes(order.id)}
                                            onChange={() => toggleSelect(order.id)}
                                        />
                                    </td>
                                    
                                    <td className="py-3 px-3 align-top min-w-[140px]">
                                        <Link href={`/admin/orders/${order.id}`} className="font-semibold text-[#2271b1] hover:text-[#135e96] hover:underline">
                                            #{order.orderNumber} {customerName}
                                        </Link>
                                        
                                        <div className="text-[12px] text-[#646970] mt-1 xl:hidden">
                                            Origin: {originText}
                                        </div>

                                        <div className="text-[12px] text-[#646970] mt-1 md:hidden">
                                            {displayDate}
                                        </div>
                                    </td>
                                    
                                    <td className="py-3 px-3 align-top whitespace-nowrap text-[#3c434a] hidden md:table-cell">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[#0073aa] cursor-pointer hover:text-[#005177]" title="Preview">
                                                <Eye size={16} className="opacity-70"/>
                                            </span>
                                            {displayDate}
                                        </div>
                                    </td>
                                    
                                    <td className="py-3 px-3 align-top">
                                        {isTrashView ? getStatusBadge('DELETED') : getStatusBadge(order.status)}
                                    </td>
                                    
                                    <td className="py-3 px-3 align-top min-w-[180px] hidden lg:table-cell">
                                        {formatAddress(order.billingAddress)}
                                        {order.paymentGateway && (
                                            <div className="text-[12px] text-[#646970] mt-1">
                                                via {order.paymentMethod || order.paymentGateway}
                                            </div>
                                        )}
                                    </td>
                                    
                                    <td className="py-3 px-3 align-top min-w-[180px] hidden sm:table-cell">
                                        {formatAddress(order.shippingAddress)}
                                        {order.shippingMethod && (
                                            <div className="text-[12px] text-[#646970] mt-1 flex items-center gap-1">
                                                {hasTracking && <Truck size={12} className="text-[#2271b1]" />}
                                                via {order.shippingMethod}
                                            </div>
                                        )}
                                    </td>
                                    
                                    <td className="py-3 px-3 align-top whitespace-nowrap text-[#3c434a]">
                                        <span className="font-semibold text-[#2c3338]">{formatPrice(order.total)}</span>
                                        <div className="text-[12px] text-[#646970] mt-1">
                                            {order._count?.items || 0} items
                                        </div>
                                    </td>
                                    
                                    <td className="py-3 px-3 align-top text-right">
                                        {isProcessingThis ? (
                                            <Loader2 className="h-5 w-5 animate-spin text-[#8c8f94] inline-block" />
                                        ) : (
                                            <div className="flex items-center justify-end gap-1">
                                                {!isTrashView ? (
                                                    <>
                                                        {order.status === "PROCESSING" && (
                                                            <button 
                                                                title="Complete"
                                                                onClick={() => handleSingleAction(order.id, 'complete')}
                                                                className="h-7 w-7 flex items-center justify-center border border-[#c3c4c7] bg-[#f6f7f7] text-[#5b841b] rounded-[3px] hover:bg-white hover:text-green-700 shadow-sm"
                                                            >
                                                                <Check size={16} strokeWidth={3}/>
                                                            </button>
                                                        )}
                                                        <Link 
                                                            title="View"
                                                            href={`/admin/orders/${order.id}`}
                                                            className="h-7 w-7 flex items-center justify-center border border-[#c3c4c7] bg-[#f6f7f7] text-[#a7aaad] rounded-[3px] hover:bg-white hover:text-[#2271b1] shadow-sm"
                                                        >
                                                            <Eye size={16}/>
                                                        </Link>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button 
                                                            title="Restore"
                                                            onClick={() => handleSingleAction(order.id, 'restore')}
                                                            className="h-7 w-7 flex items-center justify-center border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] rounded-[3px] hover:bg-white shadow-sm"
                                                        >
                                                            <RefreshCcw size={14}/>
                                                        </button>
                                                        <button 
                                                            title="Delete Permanently"
                                                            onClick={() => handleSingleAction(order.id, 'delete')}
                                                            className="h-7 w-7 flex items-center justify-center border border-[#c3c4c7] bg-[#f6f7f7] text-[#d63638] rounded-[3px] hover:bg-white shadow-sm"
                                                        >
                                                            <AlertTriangle size={14}/>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    
                                    <td className="py-3 px-3 align-top text-[13px] text-[#646970] hidden xl:table-cell">
                                        {originText}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};