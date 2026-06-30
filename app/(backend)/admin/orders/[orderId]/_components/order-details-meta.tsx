// File Location: app/admin/orders/[orderId]/_components/order-details-meta.tsx

"use client";

import { useState, useTransition } from "react";
import { formatTz } from "@/lib/store-time";
import { 
    Edit2, Loader2, ExternalLink, MapPin, 
    CreditCard, DollarSign, Package, AlertCircle, Link as LinkIcon 
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

// --- Server Actions ---
import { updateOrderStatus } from "@/app/actions/backend/order/update-status";
import { updateOrderCustomerDetails } from "@/app/actions/backend/order/update-order-customer";
import { searchTransdirectLocations } from "@/app/actions/backend/order/transdirect-locations";

// ✅ STRICT TYPES IMPORT
import { OrderDetailsType, AddressJson, OrderUser, OrderStatus } from "../types";

interface OrderDetailsMetaProps {
  order: OrderDetailsType;
  timezone?: string;
}

type LocationSuggestion = { city: string; state: string; postcode: string | number };

export const OrderDetailsMeta = ({ order, timezone = "UTC" }: OrderDetailsMetaProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // --- Toggle Edit States ---
  const [editBilling, setEditBilling] = useState<boolean>(false);
  const [editShipping, setEditShipping] = useState<boolean>(false);
  const [savingBilling, setSavingBilling] = useState<boolean>(false);
  const [savingShipping, setSavingShipping] = useState<boolean>(false);
  
  // ✅ STRICT ADDRESS PARSING
  const shipping: AddressJson = typeof order.shippingAddress === 'object' && order.shippingAddress !== null ? order.shippingAddress : {};
  const billing: AddressJson = typeof order.billingAddress === 'object' && order.billingAddress !== null ? order.billingAddress : {};
  const user: OrderUser | null = order.user;

  // ==========================================
  // TRANSACTION & PAYMENT LOGIC (FIXED)
  // ==========================================
  const successTx = order.transactions?.find(tx => tx.status === 'SUCCESS' || tx.status === 'succeeded' || tx.status === 'COMPLETED');
  
  const displayTxId = order.paymentId || order.paymentIntentId || order.chargeId || successTx?.transactionId;

  let paidDateStr: string | null = null;
  if (order.paymentStatus === 'PAID') {
      // 👈 ফিক্সড: order.updatedAt সরিয়ে দেওয়া হয়েছে। এখন ট্রানজেকশন না থাকলে আসল অর্ডারের টাইমটাই দেখাবে।
      const paidDateObj = successTx?.createdAt || order.capturedAt || order.createdAt;
      const formatted = formatTz(new Date(paidDateObj), timezone, "MMM d, yyyy '@' h:mm a");
      paidDateStr = formatted.replace('AM', 'am').replace('PM', 'pm');
  }

  // ==========================================
  // DATE PROCESSING
  // ==========================================
  const orderDate = new Date(order.createdAt);
  const dateStr = formatTz(orderDate, timezone, "yyyy-MM-dd");
  const hourStr = formatTz(orderDate, timezone, "HH");
  const minuteStr = formatTz(orderDate, timezone, "mm");

  // ==========================================
  // STRICT FORM STATES
  // ==========================================
  const [formData, setFormData] = useState({
    status: order.status as OrderStatus,
    firstName: user?.name?.split(" ")[0] || billing.firstName || shipping.firstName || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || billing.lastName || shipping.lastName || "",
    email: user?.email || order.guestEmail || "",
    phone: billing.phone || shipping.phone || user?.phone || "",
    
    billAddress1: billing.address1 || "",
    billCity: billing.city || "",
    billState: billing.state || "",
    billPostcode: billing.postcode || "",
    
    shipAddress1: shipping.address1 || "",
    shipCity: shipping.city || "",
    shipState: shipping.state || "",
    shipPostcode: shipping.postcode || ""
  });

  // ==========================================
  // AUTO SUGGESTION STATES
  // ==========================================
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<"bill" | "ship" | null>(null);
  const [searching, setSearching] = useState<boolean>(false);

  const [billSearch, setBillSearch] = useState<string>(billing.city || billing.postcode || "");
  const [shipSearch, setShipSearch] = useState<string>(shipping.city || shipping.postcode || "");

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleStatusChange = (newStatus: string) => {
      const typedStatus = newStatus as OrderStatus;
      setFormData({...formData, status: typedStatus});
      const form = new FormData();
      form.append("orderId", order.id);
      form.append("status", typedStatus);
      
      startTransition(async () => {
          const res = await updateOrderStatus(form);
          if (res.success) {
              toast.success("Order status updated successfully.");
              router.refresh();
          } else {
              toast.error(res.error || "Failed to update order status.");
              setFormData({...formData, status: order.status});
          }
      });
  };

  const handleLocationSearch = async (val: string, type: "bill" | "ship") => {
      if (type === "bill") setBillSearch(val);
      else setShipSearch(val);
      
      if (val.length > 2) {
          setSearching(true);
          setShowSuggestions(type);
          try {
              const results = await searchTransdirectLocations(val);
              setSuggestions(results as LocationSuggestion[]);
          } catch (err) {
              console.error("Location fetch error", err);
          } finally {
              setSearching(false);
          }
      } else {
          setSuggestions([]);
          setShowSuggestions(null);
      }
  };

  const selectLocation = (loc: LocationSuggestion, type: "bill" | "ship") => {
      if (type === "bill") {
          setBillSearch(loc.city);
          setFormData(prev => ({ ...prev, billCity: loc.city, billState: loc.state, billPostcode: String(loc.postcode) }));
      } else {
          setShipSearch(loc.city);
          setFormData(prev => ({ ...prev, shipCity: loc.city, shipState: loc.state, shipPostcode: String(loc.postcode) }));
      }
      setShowSuggestions(null);
  };

  const handleSaveDetails = async (type: "billing" | "shipping") => {
      if(type === "billing") setSavingBilling(true);
      else setSavingShipping(true);

      const form = new FormData();
      form.append("orderId", order.id);
      form.append("name", `${formData.firstName} ${formData.lastName}`.trim());
      form.append("email", formData.email);
      form.append("phone", formData.phone);
      
      form.append("ship_address1", type === "shipping" ? formData.shipAddress1 : formData.billAddress1);
      form.append("ship_city", type === "shipping" ? formData.shipCity : formData.billCity);
      form.append("ship_state", type === "shipping" ? formData.shipState : formData.billState);
      form.append("ship_postcode", type === "shipping" ? formData.shipPostcode : formData.billPostcode);
      form.append("ship_country", "AU");

      try {
          const res = await updateOrderCustomerDetails(form);
          if (res.success) {
              toast.success(`${type === "billing" ? "Billing" : "Shipping"} details updated.`);
              if (type === "billing") setEditBilling(false);
              if (type === "shipping") setEditShipping(false);
              router.refresh();
          } else {
              toast.error(res.error || "Failed to update details.");
          }
      } catch (error) {
          toast.error("A critical error occurred while saving.");
      } finally {
          if(type === "billing") setSavingBilling(false);
          else setSavingShipping(false);
      }
  };

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mb-5 rounded-[3px] relative z-20">
      
      {/* ========================================== */}
      {/* HEADER SECTION (WOOCOMMERCE STYLE)         */}
      {/* ========================================== */}
      <div className="px-4 py-3 border-b border-[#c3c4c7]">
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0 flex items-center gap-2">
            Order #{order.orderNumber} details
            
            {/* SCHEMA: Advanced Pre-Order Status Badge */}
            {order.hasPreOrderItems && (
                <span className="bg-[#fcf9e8] text-[#dba617] border border-[#e5d599] px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold uppercase flex items-center gap-1 shadow-inner">
                    <div className="relative flex items-center justify-center">
                        <Package size={10} />
                        <AlertCircle size={6} className="absolute -top-1 -right-1 text-[#d63638] fill-white" />
                    </div>
                    Pre-Order
                </span>
            )}
        </h2>
        <div className="text-[13px] text-[#646970] mt-1 space-y-0.5">
            <p className="m-0">
                Payment via {order.paymentGateway || order.paymentMethod || "Unknown"}
                {displayTxId && (
                    <> {' '}(<span className="text-[#2271b1] cursor-pointer hover:underline font-mono">{displayTxId}</span>)</>
                )}
                {paidDateStr ? `. Paid on ${paidDateStr}` : ". Awaiting payment."}
            </p>
            
            {/* SCHEMA: Advanced Payment, Invoice & Tracking Meta */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] mt-1">
                {order.ipAddress && (
                    <span className="flex items-center gap-1 text-[#8c8f94]">
                        <strong>Customer IP:</strong> <span className="font-mono bg-[#f6f7f7] border border-[#e2e4e7] px-1 rounded">{order.ipAddress}</span>
                    </span>
                )}
                {order.isAuthorized && !order.isCaptured && (
                    <span className="flex items-center gap-1 text-[#dba617] font-semibold bg-[#fcf9e8] px-1 rounded border border-[#e5d599]">
                        <CreditCard size={10}/> Funds Authorized (Not Captured)
                    </span>
                )}
                {order.invoiceNumber && (
                    <span className="flex items-center gap-1 text-[#5b841b] font-semibold bg-[#e5f5fa] px-1 rounded border border-[#c0d9e1]">
                        <DollarSign size={10}/> Invoice: {order.invoiceNumber}
                    </span>
                )}
            </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MAIN CONTENT - 3 COLUMNS GRID              */}
      {/* ========================================== */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* -------------------------------------- */}
        {/* COLUMN 1: GENERAL                      */}
        {/* -------------------------------------- */}
        <div>
            <h3 className="text-[14px] font-semibold text-[#1d2327] mb-3">General</h3>
            
            <div className="space-y-4">
                <div className="space-y-1 text-[13px] text-[#3c434a]">
                    <label className="block mb-1 text-[#646970]">Date created:</label>
                    <div className="flex items-center gap-1">
                        <input type="text" readOnly value={dateStr} className="w-[100px] h-[28px] px-2 border border-[#8c8f94] bg-white rounded-[3px] text-center shadow-inner text-[#32373c]" />
                        <span className="text-[#646970]">@</span>
                        <input type="text" readOnly value={hourStr} className="w-[40px] h-[28px] px-2 border border-[#8c8f94] bg-white rounded-[3px] text-center shadow-inner text-[#32373c]" />
                        <span className="text-[#646970]">:</span>
                        <input type="text" readOnly value={minuteStr} className="w-[40px] h-[28px] px-2 border border-[#8c8f94] bg-white rounded-[3px] text-center shadow-inner text-[#32373c]" />
                    </div>
                </div>

                <div className="space-y-1 text-[13px]">
                    <label className="block mb-1 text-[#646970]">Status:</label>
                    <div className="relative">
                        <select 
                            value={formData.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={isPending}
                            className="w-full max-w-[250px] h-[28px] px-2 border border-[#8c8f94] bg-white text-[#32373c] rounded-[3px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] shadow-sm disabled:bg-[#f6f7f7] cursor-pointer"
                        >
                            <option value="DRAFT">Draft</option>
                            <option value="PENDING">Pending payment</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="AWAITING_PAYMENT">Awaiting Payment</option>
                            <option value="PACKED">Packed</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="REFUNDED">Refunded</option>
                            <option value="FAILED">Failed</option>
                            <option value="RETURNED">Returned</option>
                        </select>
                        {isPending && <Loader2 size={14} className="absolute right-[20px] top-[7px] animate-spin text-[#2271b1]" />}
                    </div>
                </div>

                <div className="space-y-1 text-[13px]">
                    <label className="block mb-1 text-[#646970]">Customer:</label>
                    <div className="relative w-full max-w-[250px]">
                        <select 
                            disabled 
                            className="w-full h-[28px] px-2 border border-[#8c8f94] bg-[#f6f7f7] text-[#32373c] rounded-[3px] outline-none shadow-sm cursor-not-allowed appearance-none"
                        >
                            {user ? (
                                <option>Registered: {user.email}</option>
                            ) : (
                                <option>Guest ({order.guestEmail || formData.email || "No email"})</option>
                            )}
                        </select>
                    </div>
                    
                    {user && (
                        <div className="mt-1.5">
                            <Link href={`/admin/users/${user.id}`} target="_blank" className="text-[#2271b1] hover:text-[#135e96] hover:underline flex items-center gap-1 text-[12px]">
                                View Profile <ExternalLink size={12}/>
                            </Link>
                        </div>
                    )}
                </div>

                {/* SCHEMA: Additional Order Relations */}
                <div className="pt-2 mt-2 space-y-1 text-[12px] text-[#646970]">
                    {order.currency && (
                        <div className="flex justify-between max-w-[250px] border-t border-[#f0f0f1] pt-1">
                            <span>Currency:</span> <span className="font-bold text-[#3c434a]">{order.currency}</span>
                        </div>
                    )}
                    {order.subscriptionId && (
                        <div className="flex justify-between max-w-[250px] border-t border-[#f0f0f1] pt-1">
                            <span>Subscription:</span>
                            <Link href={`/admin/subscriptions/${order.subscriptionId}`} className="text-[#2271b1] hover:underline flex items-center gap-1">
                                <LinkIcon size={10}/> View Sub
                            </Link>
                        </div>
                    )}
                    {order.affiliate && (
                        <div className="flex justify-between max-w-[250px] border-t border-[#f0f0f1] pt-1">
                            <span>Affiliate:</span>
                            <Link href={`/admin/affiliates/${order.affiliate.id}`} className="text-[#2271b1] hover:underline">
                                {order.affiliate.user?.name || "Partner"}
                            </Link>
                        </div>
                    )}
                </div>

                {/* UTM / Traffic Source */}
                {(order.utmSource || order.utmMedium || order.utmCampaign || order.referringSite) && (
                    <div className="pt-3 mt-3 border-t border-[#f0f0f1]">
                        <p className="text-[11px] font-semibold text-[#1d2327] uppercase tracking-wide mb-2">Traffic Source</p>
                        <div className="space-y-1 text-[12px] text-[#646970]">
                            {order.utmSource && (
                                <div className="flex items-center gap-2">
                                    <span className="w-[70px] shrink-0">Source:</span>
                                    <span className="font-mono bg-[#f6f7f7] border border-[#e2e4e7] px-1.5 py-0.5 rounded text-[#2271b1] font-semibold">{order.utmSource}</span>
                                </div>
                            )}
                            {order.utmMedium && (
                                <div className="flex items-center gap-2">
                                    <span className="w-[70px] shrink-0">Medium:</span>
                                    <span className="font-mono bg-[#f6f7f7] border border-[#e2e4e7] px-1.5 py-0.5 rounded text-[#3c434a]">{order.utmMedium}</span>
                                </div>
                            )}
                            {order.utmCampaign && (
                                <div className="flex items-center gap-2">
                                    <span className="w-[70px] shrink-0">Campaign:</span>
                                    <span className="font-mono bg-[#f6f7f7] border border-[#e2e4e7] px-1.5 py-0.5 rounded text-[#3c434a]">{order.utmCampaign}</span>
                                </div>
                            )}
                            {order.referringSite && (
                                <div className="flex items-center gap-2">
                                    <span className="w-[70px] shrink-0">Referrer:</span>
                                    <span className="font-mono bg-[#f6f7f7] border border-[#e2e4e7] px-1.5 py-0.5 rounded text-[#3c434a] truncate max-w-[150px]" title={order.referringSite}>{order.referringSite}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* -------------------------------------- */}
        {/* COLUMN 2: BILLING                      */}
        {/* -------------------------------------- */}
        <div>
            <div className="flex justify-between items-center mb-3 group">
                <h3 className="text-[14px] font-semibold text-[#1d2327]">Billing</h3>
                {!editBilling && (
                    <button 
                        onClick={() => setEditBilling(true)} 
                        className="text-[#a7aaad] hover:text-[#2271b1] transition-colors"
                        title="Edit Billing Address"
                    >
                        <Edit2 size={14} />
                    </button>
                )}
            </div>
            
            {editBilling ? (
                // EDIT MODE
                <div className="space-y-2 text-[12px] bg-[#f6f7f7] p-3 border border-[#e2e4e7] rounded-[3px] shadow-inner">
                    <input placeholder="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    <input placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    <input placeholder="Address Line 1" value={formData.billAddress1} onChange={e => setFormData({...formData, billAddress1: e.target.value})} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    
                    {/* Suburb Auto Suggest */}
                    <div className="relative">
                        <input placeholder="Suburb / Postcode (Type to search)" value={billSearch} onChange={e => handleLocationSearch(e.target.value, "bill")} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                        {searching && showSuggestions === "bill" && <Loader2 size={12} className="absolute right-2 top-2 animate-spin text-[#2271b1]"/>}
                        {showSuggestions === "bill" && suggestions.length > 0 && (
                            <div className="absolute z-[999] w-full bg-white border border-[#2271b1] shadow-lg max-h-40 overflow-y-auto mt-1 rounded-[3px]">
                                {suggestions.map((s, i) => (
                                    <div key={i} onClick={() => selectLocation(s, "bill")} className="px-2 py-1.5 text-[12px] hover:bg-[#2271b1] hover:text-white cursor-pointer border-b border-[#f0f0f1] last:border-0">
                                        <span className="font-semibold">{s.city}</span>, {s.state} {s.postcode}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        <input placeholder="State" value={formData.billState} onChange={e => setFormData({...formData, billState: e.target.value})} className="w-1/2 h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                        <input placeholder="Postcode" value={formData.billPostcode} onChange={e => setFormData({...formData, billPostcode: e.target.value})} className="w-1/2 h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    </div>
                    <input placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] mt-2 outline-none focus:border-[#2271b1]"/>
                    <input placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    
                    <div className="flex gap-2 pt-2">
                        <button onClick={() => handleSaveDetails("billing")} disabled={savingBilling} className="bg-[#2271b1] text-white hover:bg-[#135e96] px-3 py-1 rounded-[3px] transition-colors disabled:opacity-50 flex items-center gap-1">
                            {savingBilling && <Loader2 size={12} className="animate-spin"/>} Save
                        </button>
                        <button onClick={() => setEditBilling(false)} disabled={savingBilling} className="bg-[#f0f0f1] text-[#3c434a] border border-[#8c8f94] hover:bg-[#e2e4e7] px-3 py-1 rounded-[3px] transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                // READ MODE
                <div className="text-[13px] text-[#3c434a] leading-relaxed">
                    <p className="m-0">{billing.firstName} {billing.lastName}</p>
                    {billing.company && <p className="m-0">{billing.company}</p>}
                    <p className="m-0">{billing.address1}</p>
                    {billing.address2 && <p className="m-0">{billing.address2}</p>}
                    <p className="m-0">{billing.city} {billing.state} {billing.postcode}</p>
                    <p className="m-0 uppercase">{billing.country || "AU"}</p>
                    
                    <div className="mt-4">
                        <p className="font-semibold text-[#1d2327] mb-0">Email address:</p>
                        <a href={`mailto:${order.guestEmail || user?.email}`} className="text-[#2271b1] hover:underline break-all">
                            {order.guestEmail || user?.email}
                        </a>
                    </div>
                    <div className="mt-2">
                        <p className="font-semibold text-[#1d2327] mb-0">Phone:</p>
                        <a href={`tel:${billing.phone || user?.phone}`} className="text-[#2271b1] hover:underline">
                            {billing.phone || user?.phone || "Not provided"}
                        </a>
                    </div>
                </div>
            )}
        </div>

        {/* -------------------------------------- */}
        {/* COLUMN 3: SHIPPING                     */}
        {/* -------------------------------------- */}
        <div>
            <div className="flex justify-between items-center mb-3 group">
                <h3 className="text-[14px] font-semibold text-[#1d2327]">Shipping</h3>
                {!editShipping && (
                    <button 
                        onClick={() => setEditShipping(true)} 
                        className="text-[#a7aaad] hover:text-[#2271b1] transition-colors"
                        title="Edit Shipping Address"
                    >
                        <Edit2 size={14} />
                    </button>
                )}
            </div>
            
            {editShipping ? (
                // EDIT MODE
                <div className="space-y-2 text-[12px] bg-[#f6f7f7] p-3 border border-[#e2e4e7] rounded-[3px] shadow-inner">
                    <input placeholder="Address Line 1" value={formData.shipAddress1} onChange={e => setFormData({...formData, shipAddress1: e.target.value})} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    
                    {/* Suburb Auto Suggest */}
                    <div className="relative">
                        <input placeholder="Suburb / Postcode (Type to search)" value={shipSearch} onChange={e => handleLocationSearch(e.target.value, "ship")} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                        {searching && showSuggestions === "ship" && <Loader2 size={12} className="absolute right-2 top-2 animate-spin text-[#2271b1]"/>}
                        {showSuggestions === "ship" && suggestions.length > 0 && (
                            <div className="absolute z-[999] w-full bg-white border border-[#2271b1] shadow-lg max-h-40 overflow-y-auto mt-1 rounded-[3px]">
                                {suggestions.map((s, i) => (
                                    <div key={i} onClick={() => selectLocation(s, "ship")} className="px-2 py-1.5 text-[12px] hover:bg-[#2271b1] hover:text-white cursor-pointer border-b border-[#f0f0f1] last:border-0">
                                        <span className="font-semibold">{s.city}</span>, {s.state} {s.postcode}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        <input placeholder="State" value={formData.shipState} onChange={e => setFormData({...formData, shipState: e.target.value})} className="w-1/2 h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                        <input placeholder="Postcode" value={formData.shipPostcode} onChange={e => setFormData({...formData, shipPostcode: e.target.value})} className="w-1/2 h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                        <button onClick={() => handleSaveDetails("shipping")} disabled={savingShipping} className="bg-[#2271b1] text-white hover:bg-[#135e96] px-3 py-1 rounded-[3px] transition-colors disabled:opacity-50 flex items-center gap-1">
                            {savingShipping && <Loader2 size={12} className="animate-spin"/>} Save
                        </button>
                        <button onClick={() => setEditShipping(false)} disabled={savingShipping} className="bg-[#f0f0f1] text-[#3c434a] border border-[#8c8f94] hover:bg-[#e2e4e7] px-3 py-1 rounded-[3px] transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                // READ MODE
                <div className="text-[13px] text-[#3c434a] leading-relaxed">
                    <p className="m-0">{shipping.firstName || billing.firstName} {shipping.lastName || billing.lastName}</p>
                    {shipping.company && <p className="m-0">{shipping.company}</p>}
                    <p className="m-0">{shipping.address1}</p>
                    {shipping.address2 && <p className="m-0">{shipping.address2}</p>}
                    <p className="m-0">{shipping.city} {shipping.state} {shipping.postcode}</p>
                    <p className="m-0 uppercase">{shipping.country || "AU"}</p>

                    <div className="mt-4">
                         {/* Map Link */}
                         <a 
                            href={`https://maps.google.com/?q=${shipping.address1},${shipping.city},${shipping.state},${shipping.postcode}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[#2271b1] hover:underline flex items-center gap-1"
                        >
                            <MapPin size={12}/> View on map
                        </a>
                    </div>

                    {/* SCHEMA: Advanced Shipping / Transdirect Options */}
                    {(order.estimatedTransitTime || order.authorityToLeave || order.tailgateDelivery) && (
                        <div className="mt-4 pt-3 border-t border-[#f0f0f1]">
                            <p className="font-semibold text-[#1d2327] mb-1 text-[11px] uppercase">Shipping Options:</p>
                            <ul className="m-0 pl-4 list-disc text-[11px] text-[#646970]">
                                {order.estimatedTransitTime && <li>Transit: {order.estimatedTransitTime}</li>}
                                {order.authorityToLeave && <li>Authority to Leave: Yes</li>}
                                {order.tailgateDelivery && <li>Requires Tailgate: Yes</li>}
                            </ul>
                        </div>
                    )}

                    {/* SCHEMA INTEGRATION: Customer Provided Note / Delivery Instructions */}
                    {(order.customerNote || order.deliveryInstructions) && (
                        <div className="mt-4 pt-3 border-t border-[#f0f0f1]">
                            <p className="font-semibold text-[#1d2327] mb-1">Customer provided note:</p>
                            <div className="text-[#3c434a] italic bg-[#fcf9e8] p-2.5 border border-[#e5d599] rounded-[3px] shadow-inner text-[12px] whitespace-pre-wrap">
                                &quot;{order.customerNote || order.deliveryInstructions}&quot;
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};