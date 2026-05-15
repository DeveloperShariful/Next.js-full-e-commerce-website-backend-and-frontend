// File Location: app/admin/orders/create/page.tsx

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGlobalStore } from "@/app/providers/global-store-provider";

// --- SERVER ACTIONS ---
import { createManualOrder } from "@/app/actions/admin/order/create_order/create-manual-order";

// --- WOOCOMMERCE STYLE META BOX COMPONENTS ---
import { CreateDetailsMeta } from "./_components/create-details-meta";
import { CreateItemsMeta } from "./_components/create-items-meta";
import { CustomFieldsMeta } from "../[orderId]/_components/custom-fields-meta"; 
import { DownloadablePermissionsMeta } from "../[orderId]/_components/downloadable-permissions-meta"; 

import { CreateSidebarActions } from "./_components/create-sidebar-actions";
import { CreateTransdirectSidebar } from "./_components/create-transdirect-sidebar";
import { CreateSidebarNotes } from "./_components/create-sidebar-notes";
import { CreateAttributionSidebar } from "./_components/create-attribution-sidebar";

// --- TYPES ---
import { OrderDataType } from "./types";

export default function CreateOrderPage() {
  const router = useRouter();
  const { currency } = useGlobalStore();
  const [loading, setLoading] = useState(false);

  // ==========================================
  // CENTRALIZED ORDER STATE
  // ==========================================
  const [orderData, setOrderData] = useState<OrderDataType>({
    createdAt: new Date(),
    status: "PENDING",
    customer: null, 
    guestEmail: "",
    guestPhone: "",
    
    billing: { firstName: "", lastName: "", company: "", address1: "", address2: "", city: "", state: "", postcode: "", country: "AU" },
    shipping: { firstName: "", lastName: "", company: "", address1: "", address2: "", city: "", state: "", postcode: "", country: "AU" },
    
    items: [],
    shippingCost: 0,
    shippingMethod: "",
    
    selectedCourierCode: "",
    transdirectBookingId: "",
    
    discountCode: "",
    discountAmount: 0,
    taxRate: 0,
    taxName: "Tax",
    
    customerNote: "",
    adminNote: "",
    customFields: [],
  });
  // Totals Calculation (Real-time WooCommerce Recalculate)
  const totals = useMemo(() => {
    // subtotal calculation
    const subtotal = orderData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // safe math to avoid NaN
    const safeDiscount = Number(orderData.discountAmount) || 0;
    const safeShipping = Number(orderData.shippingCost) || 0;
    const safeTaxRate = Number(orderData.taxRate) || 0;

    const taxableAmount = Math.max(0, subtotal - safeDiscount + safeShipping);
    const taxTotal = taxableAmount * (safeTaxRate / 100);
    const finalTotal = taxableAmount + taxTotal;

    return { subtotal, taxTotal, finalTotal };
  }, [orderData.items, orderData.discountAmount, orderData.shippingCost, orderData.taxRate]);

  // ==========================================
  // SUBMIT HANDLER (SAVE TO DB)
  // ==========================================
  const handleCreateOrder = async (isDraft: boolean) => {
    // Basic validations
    if (orderData.items.length === 0) {
        return toast.error("You must add at least one item to the order.");
    }
    if (!orderData.customer && !orderData.billing.firstName && !orderData.guestEmail) {
        return toast.error("Please enter customer name or email.");
    }

    setLoading(true);

    // ✅ FIXED: Clean Payload mapping for the backend action
    const payload = {
        customerId: orderData.customer?.id || null,
        guestInfo: !orderData.customer?.id ? {
            name: `${orderData.billing.firstName} ${orderData.billing.lastName}`.trim(),
            email: orderData.guestEmail,
            phone: orderData.guestPhone
        } : null,
        
        items: orderData.items,
        shippingCost: Number(orderData.shippingCost),
        shippingMethod: orderData.shippingMethod || "Standard Shipping",
        selectedCourierCode: orderData.selectedCourierCode || null,
        
        discountCode: orderData.discountCode || null,
        discountAmount: Number(orderData.discountAmount),
        
        taxTotal: totals.taxTotal,
        total: totals.finalTotal,
        
        // Priority to shipping address, fallback to billing
        address: orderData.shipping.address1 ? orderData.shipping : orderData.billing,
        
        adminNote: orderData.adminNote || null,
        customerNote: orderData.customerNote || null,
        paymentMethod: "Manual",
        currency: currency, 
        
        status: isDraft ? "DRAFT" : orderData.status,
        paymentStatus: isDraft ? "UNPAID" : (totals.finalTotal === 0 ? "PAID" : "UNPAID"),
        isDraft
    };

    try {
        const res = await createManualOrder(payload);

        if (res.success) {
            toast.success(isDraft ? "Draft saved successfully!" : "Order created successfully!");
            // Redirect to the newly created Order's Edit Page
            router.push(`/admin/orders/${res.orderId}`);
        } else {
            toast.error(res.error || "Failed to create order");
        }
    } catch (err) {
        toast.error("Critical error while saving the order.");
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-5 max-w-[100%] mx-auto min-h-screen bg-[#f0f0f1] text-[#3c434a] font-sans pb-20">
      
      {/* Top Header */}
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-[23px] font-normal text-[#1d2327] m-0 leading-none">
            Add new order
        </h1>
      </div>

      {/* Main Layout Grid */}
      <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
        
        {/* === LEFT COLUMN === */}
        <div className="w-full lg:w-[70%] xl:w-[75%] space-y-5">
          
          <CreateDetailsMeta orderData={orderData} setOrderData={setOrderData} />

          <CreateItemsMeta orderData={orderData} setOrderData={setOrderData} totals={totals} />
          
          {/* Note: Dummy order object is passed to reuse the Edit Page's UI Box safely */}
          <CustomFieldsMeta order={{ id: "new", metadata: {} } as any} />
          <DownloadablePermissionsMeta order={{ id: "new", metadata: {} } as any} />
        </div>

        {/* === RIGHT COLUMN === */}
        <div className="w-full lg:w-[30%] xl:w-[25%] space-y-5">
            
            <CreateSidebarActions 
                orderData={orderData} 
                setOrderData={setOrderData} 
                totals={totals}
                handleCreateOrder={handleCreateOrder}
                loading={loading}
            />
            
            <CreateTransdirectSidebar orderData={orderData} setOrderData={setOrderData} />
            
            <CreateSidebarNotes orderData={orderData} setOrderData={setOrderData} />
            
            <CreateAttributionSidebar />
        </div>
      </div>
    </div>
  );
}