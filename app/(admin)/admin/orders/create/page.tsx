// File: app/admin/orders/create/page.tsx

"use client"

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";

import { createManualOrder } from "@/app/actions/admin/create_order/create-manual-order";
import { ProductSearch } from "./_components/product-search";
import { CartItemsTable } from "./_components/cart-items-table";
import { CustomerSelector } from "./_components/customer-selector";
import { OrderSummary } from "./_components/order-summary";
import { Coupon } from "./_components/coupon"; 
import { ShippingSelector } from "./_components/shipping-selector"; 
import { GiftCardInput } from "./_components/gift-card-input"; // ✅ NEW IMPORT

interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
  image?: string;
  maxStock: number;
  weight: number;
  length: number;
  width: number;
  height: number;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [guestInputAddress, setGuestInputAddress] = useState<any>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [appliedGiftCard, setAppliedGiftCard] = useState<any>(null); // ✅ NEW STATE
  
  const [pickupLocationId, setPickupLocationId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [transitTime, setTransitTime] = useState(""); // ✅ Transit Time State

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // Discount Calculation
    let discountAmount = 0;
    if (appliedDiscount) {
      discountAmount = appliedDiscount.type === "PERCENTAGE" 
        ? (subtotal * appliedDiscount.value) / 100 
        : appliedDiscount.value;
    }
    
    const taxableAmount = Math.max(0, subtotal - discountAmount + shippingCost);
    const taxTotal = taxableAmount * 0.10; 
    
    // Total before Gift Card
    const grossTotal = taxableAmount + taxTotal;

    // Gift Card Deduction
    let giftCardDeduction = 0;
    if (appliedGiftCard) {
        giftCardDeduction = Math.min(appliedGiftCard.balance, grossTotal);
    }

    const finalTotal = Math.max(0, grossTotal - giftCardDeduction);

    return { subtotal, discountAmount, taxTotal, grossTotal, finalTotal, giftCardDeduction };
  }, [cartItems, appliedDiscount, shippingCost, appliedGiftCard]);

  const currentAddress = useMemo(() => {
      if (!selectedCustomer && !guestInputAddress) return null;
      if (selectedCustomer?.addresses?.[0]) {
          return {
              city: selectedCustomer.addresses[0].city,
              postcode: selectedCustomer.addresses[0].postcode,
              state: selectedCustomer.addresses[0].state,
              country: selectedCustomer.addresses[0].country
          };
      }
      return guestInputAddress;
  }, [selectedCustomer, guestInputAddress]);

  const addToCart = (product: any, variant?: any) => {
    const price = variant ? variant.price : product.price;
    const stock = variant ? variant.stock : product.stock;
    const name = variant ? `${product.name} - ${variant.name}` : product.name;
    const sku = variant ? variant.sku : product.sku;

    const existing = cartItems.find(
      item => item.productId === product.id && item.variantId === (variant?.id || null)
    );

    if (existing) {
      if (existing.quantity < stock) {
        setCartItems(cartItems.map(item => 
          (item.productId === product.id && item.variantId === (variant?.id || null)) 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        ));
        toast.success("Quantity updated");
      } else {
        toast.error("Out of stock!");
      }
    } else {
      setCartItems([...cartItems, {
        productId: product.id,
        variantId: variant?.id || undefined,
        name,
        price,
        quantity: 1,
        sku,
        image: product.featuredImage,
        maxStock: stock,
        weight: Number(variant?.weight || product.weight || 1),
        length: Number(variant?.length || product.length || 10),
        width: Number(variant?.width || product.width || 10),
        height: Number(variant?.height || product.height || 10)
      }]);
      toast.success("Added to order");
    }
  };

  const removeCartItem = (index: number) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) return toast.error("Please set the customer first");
    if (cartItems.length === 0) return toast.error("Add at least one item");

    setLoading(true);

    const orderData = {
      customerId: selectedCustomer.id || null,
      guestInfo: !selectedCustomer.id ? {
        name: selectedCustomer.name,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone
      } : null,
      items: cartItems,
      shippingCost,
      
      discountCode: appliedDiscount?.code || null,
      discountAmount: totals.discountAmount,
      
      // ✅ NEW: Gift Card Data
      giftCardCode: appliedGiftCard?.code || null,
      giftCardAmount: totals.giftCardDeduction,

      taxTotal: totals.taxTotal,
      total: totals.finalTotal, // Final amount to be paid
      
      address: selectedCustomer.addresses?.[0] || guestInputAddress,
      pickupLocationId,
      
      // ✅ NEW: Transit Time
      estimatedTransitTime: transitTime || null,

      adminNote,
      customerNote,
      currency: "AUD", 
      
      status: "PENDING",
      // If Fully paid by Gift Card
      paymentStatus: (totals.finalTotal === 0 && totals.grossTotal > 0) ? "PAID" : "UNPAID"
    };

    const res = await createManualOrder(orderData);

    if (res.success) {
      toast.success("Order created successfully!");
      router.push(`/admin/orders/${res.orderId}`);
    } else {
      toast.error(res.error || "Failed to create order");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen bg-slate-50/50">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Order</h1>
          <p className="text-slate-500 text-sm">Draft a manual order with full schema support</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none bg-white" onClick={() => router.back()}>
            <X size={16} className="mr-2"/> Cancel
          </Button>
          <Button 
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-lg" 
            onClick={handleSubmit}
            disabled={loading}
          >
            <Save size={16} className="mr-2"/> {loading ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <ProductSearch onAddProduct={addToCart} />
          <CartItemsTable items={cartItems} onRemoveItem={removeCartItem} />
        </div>

        <div className="space-y-6">
          <CustomerSelector 
            selectedCustomer={selectedCustomer}
            onSelect={(cust) => setSelectedCustomer(cust)}
            onRemove={() => {
                setSelectedCustomer(null);
                setGuestInputAddress(null);
            }}
            onAddressChange={(addr) => setGuestInputAddress(addr)}
          />

          <ShippingSelector 
            onPickupLocationChange={setPickupLocationId}
            onAdminNoteChange={setAdminNote}
            onCustomerNoteChange={setCustomerNote}
            onShippingCostChange={(cost) => setShippingCost(cost)}
            address={currentAddress}
            cartItems={cartItems}
          />

          <Coupon 
            cartSubtotal={totals.subtotal}
            onApplyDiscount={(discount: any) => setAppliedDiscount(discount)}
          />

          {/* ✅ NEW: Gift Card Input */}
          <GiftCardInput 
            onApply={setAppliedGiftCard}
            onRemove={() => setAppliedGiftCard(null)}
            appliedCard={appliedGiftCard}
          />

          <OrderSummary 
            subtotal={totals.subtotal}
            shippingCost={shippingCost}
            discount={totals.discountAmount}
            tax={totals.taxTotal}
            total={totals.finalTotal} // Final Payable
            currencySymbol="$"
            setShippingCost={setShippingCost}
          />

          {totals.giftCardDeduction > 0 && (
             <div className="p-3 bg-purple-50 text-xs text-purple-800 rounded border border-purple-200">
                Paid via Gift Card: <strong>-${totals.giftCardDeduction.toFixed(2)}</strong>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}