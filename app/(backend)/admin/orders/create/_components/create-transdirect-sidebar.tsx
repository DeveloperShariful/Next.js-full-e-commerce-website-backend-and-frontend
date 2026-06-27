// File Location: app/admin/orders/create/_components/create-transdirect-sidebar.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, Loader2, Truck, CheckCircle } from "lucide-react";
import { OrderDataType } from "../types";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { getTransdirectQuotes } from "@/app/actions/backend/order/create_order/get-transdirect-quotes"; 
import { getShippingResources } from "@/app/actions/backend/order/create_order/get-shipping-resources";

interface CreateTransdirectSidebarProps {
  orderData: OrderDataType;
  setOrderData: React.Dispatch<React.SetStateAction<OrderDataType>>;
}

export const CreateTransdirectSidebar = ({ orderData, setOrderData }: CreateTransdirectSidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { formatPrice } = useGlobalStore();
  
  const [loadingShipping, setLoadingShipping] = useState(false);
  interface ShippingOption { id: string; name: string; price: number; type: string; transit_time?: string; }
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);

  // 🔥 IRON-CLAD GATEKEEPER: Prevents continuous API calls
  const lastQuotePayload = useRef<string>("");

  const formatServiceName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace("Tnt", "TNT").replace("Dhl", "DHL");
  };

  useEffect(() => {
    const targetAddress = orderData.shipping.city ? orderData.shipping : orderData.billing;
    
    if (!targetAddress.city || !targetAddress.postcode || orderData.items.length === 0) {
        setShippingOptions([]);
        lastQuotePayload.current = ""; 
        return;
    }

    const currentFingerprint = JSON.stringify({
        city: targetAddress.city.trim().toLowerCase(),
        postcode: targetAddress.postcode.trim(),
        state: targetAddress.state.trim().toLowerCase(),
        items: orderData.items.map((i) => ({ id: i.productId, qty: i.quantity }))
    });

    if (lastQuotePayload.current === currentFingerprint) {
        return; 
    }

    const fetchShipping = async () => {
        setLoadingShipping(true);
        lastQuotePayload.current = currentFingerprint; 

        try {
            const localRes = await getShippingResources();
            const localRates = (localRes.shippingRates || []).map((r) => ({
                id: r.id, name: r.name, price: Number(r.price), type: 'local' as const
            }));

            const tdRes = await getTransdirectQuotes({
                items: orderData.items,
                receiver: {
                    suburb: targetAddress.city,
                    postcode: targetAddress.postcode,
                    state: targetAddress.state
                }
            });

            const liveQuotes = tdRes.success ? tdRes.quotes : [];
            const allMethods = [...localRates, ...liveQuotes].sort((a, b) => a.price - b.price);
            setShippingOptions(allMethods);
            
        } catch (error) {
            console.error("Shipping calc error:", error);
            setShippingOptions([]);
        } finally {
            setLoadingShipping(false);
        }
    };

    const timer = setTimeout(fetchShipping, 1500); // 1.5s Debounce to avoid spamming while typing
    return () => clearTimeout(timer);
    
  }, [orderData.items, orderData.shipping.city, orderData.shipping.postcode, orderData.billing.city, orderData.billing.postcode]);


  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      <div 
        className="px-3 py-2 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none hover:bg-[#f6f7f7] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">Transdirect Sync & Shipping</h2>
        <button type="button" className="text-[#646970]">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className="p-3 text-[13px] text-[#3c434a]">
            
            <label className="text-[12px] text-[#646970] font-semibold mb-2 block">Live Shipping Quotes</label>
            
            {loadingShipping ? (
                <div className="flex items-center justify-center gap-2 p-4 text-[#2271b1] bg-[#f6f7f7] border border-[#e2e4e7] rounded-[3px]">
                    <Loader2 size={16} className="animate-spin"/> Calculating rates...
                </div>
            ) : shippingOptions.length > 0 ? (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {shippingOptions.map((opt, i) => {
                        const isSelected = orderData.shippingMethod === formatServiceName(opt.name);
                        return (
                            <div 
                                key={i}
                                onClick={() => setOrderData({
                                    ...orderData, 
                                    shippingMethod: formatServiceName(opt.name), 
                                    shippingCost: Number(opt.price),
                                    selectedCourierCode: opt.type === 'transdirect' ? opt.id : ""
                                })}
                                className={`flex items-center justify-between p-2 rounded-[3px] border cursor-pointer transition-colors ${
                                    isSelected ? 'bg-[#f0f6fc] border-[#2271b1] shadow-sm' : 'bg-white border-[#c3c4c7] hover:border-[#8c8f94]'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <input type="radio" checked={isSelected} readOnly className="mt-0.5" />
                                    <div>
                                        <div className={`font-semibold ${isSelected ? 'text-[#135e96]' : 'text-[#3c434a]'}`}>
                                            {formatServiceName(opt.name)}
                                        </div>
                                    </div>
                                </div>
                                <div className="font-bold text-[#1d2327]">
                                    {formatPrice(opt.price)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-3 text-[12px] text-[#646970] bg-[#f6f7f7] border border-[#e2e4e7] rounded-[3px] italic text-center">
                    Enter valid Postcode, City and add items to see live courier quotes.
                </div>
            )}

            <div className="mt-4 pt-3 border-t border-[#f0f0f1]">
                <button disabled className="w-full bg-[#f6f7f7] border border-[#c3c4c7] text-[#a7aaad] h-[30px] px-3 text-[13px] rounded-[3px] font-medium cursor-not-allowed flex items-center justify-center gap-2 shadow-sm mb-2">
                    <Truck size={14}/> Book with Transdirect
                </button>
                <p className="text-[11px] text-[#646970] m-0 leading-snug">
                    Booking and label generation will be available once the order is created and saved.
                </p>
            </div>
        </div>
      )}
    </div>
  );
};