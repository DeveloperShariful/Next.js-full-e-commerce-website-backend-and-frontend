// File Location: app/admin/orders/create/_components/create-items-meta.tsx

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Package, Trash2, Loader2, Plus, X, Truck, Store, MapPin, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useGlobalStore } from "@/app/providers/global-store-provider";

import { searchProducts } from "@/app/actions/admin/order/create_order/search-resources";
import { validateDiscount } from "@/app/actions/admin/order/create_order/validate-discount";
import { getTransdirectQuotes } from "@/app/actions/admin/order/create_order/get-transdirect-quotes"; 
import { getShippingResources } from "@/app/actions/admin/order/create_order/get-shipping-resources";

import { OrderDataType, OrderTotalsType, CartItemType } from "../types"; 

interface CreateItemsMetaProps {
  orderData: OrderDataType;
  setOrderData: React.Dispatch<React.SetStateAction<OrderDataType>>;
  totals: OrderTotalsType;
}

export const CreateItemsMeta = ({ orderData, setOrderData, totals }: CreateItemsMetaProps) => {
  const { formatPrice, currency } = useGlobalStore();

  const [showAddItems, setShowAddItems] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [showCustomItem, setShowCustomItem] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [customItem, setCustomItem] = useState({ name: "", price: "", quantity: "1" });
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // ==========================================
  // SHIPPING & TRANSDIRECT LOGIC (FIXED INFINITE LOOP)
  // ==========================================
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  
  const [pickupPoints, setPickupPoints] = useState<any[]>([]);
  const [localRates, setLocalRates] = useState<any[]>([]);
  const [liveQuotes, setLiveQuotes] = useState<any[]>([]);
  
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");

  // 🔥 IRON-CLAD GATEKEEPER: Prevents continuous API calls
  const lastQuotePayload = useRef<string>("");

  const formatServiceName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()).replace("Tnt", "TNT").replace("Dhl", "DHL");
  };

  // 1. Fetch Local Resources on Mount
  useEffect(() => {
    const loadResources = async () => {
      setLoadingLocal(true);
      const res = await getShippingResources();
      setPickupPoints(res.pickupLocations || []);
      
      const mappedRates = (res.shippingRates || []).map((r: any) => ({
          id: r.id, name: r.name, price: Number(r.price), type: 'local', desc: r.zone?.name || "Flat Rate"
      }));
      setLocalRates(mappedRates);
      setLoadingLocal(false);
    };
    loadResources();
  }, []);

  // 2. Fetch Live Transdirect Quotes (SAFE)
  useEffect(() => {
    const targetAddress = orderData.shipping.city ? orderData.shipping : orderData.billing;

    // Basic Validation: Don't call API if address is empty or postcode is too short
    if (!targetAddress.postcode || targetAddress.postcode.length < 3 || !targetAddress.city || orderData.items.length === 0) {
        setLiveQuotes([]); 
        lastQuotePayload.current = ""; // Reset ref
        return;
    }

    // Create a unique fingerprint of the current cart and address
    const currentFingerprint = JSON.stringify({
        city: targetAddress.city.trim().toLowerCase(),
        postcode: targetAddress.postcode.trim(),
        state: targetAddress.state.trim().toLowerCase(),
        items: orderData.items.map((i) => ({ id: i.productId, qty: i.quantity }))
    });

    // 🔥 If the fingerprint hasn't changed, DO NOT CALL THE API AGAIN!
    if (lastQuotePayload.current === currentFingerprint) {
        return; 
    }

    const fetchLiveQuotes = async () => {
        setLoadingQuotes(true);
        // Lock the gate immediately
        lastQuotePayload.current = currentFingerprint; 

        try {
            const res = await getTransdirectQuotes({
                items: orderData.items,
                receiver: { suburb: targetAddress.city, postcode: targetAddress.postcode, state: targetAddress.state }
            });

            if (res.success) {
                setLiveQuotes(res.quotes);
            } else {
                setLiveQuotes([]); // Reset if failed
            }
        } catch (error) {
            console.error("Transdirect Error:", error);
            setLiveQuotes([]);
        } finally {
            setLoadingQuotes(false);
        }
    };

    // Debounce to allow user to finish typing
    const timer = setTimeout(fetchLiveQuotes, 1500); 
    return () => clearTimeout(timer);
    
  }, [orderData.shipping.city, orderData.shipping.postcode, orderData.billing.city, orderData.billing.postcode, orderData.items]);

  // 3. Merge and Sort All Methods
  const allMethods = useMemo(() => {
      const filteredLocalRates = localRates.filter(r => {
          if (liveQuotes.length > 0) {
              const nameLower = r.name.toLowerCase();
              return !nameLower.includes("transdirect") && !nameLower.includes("carrier");
          }
          return true;
      });

      return [
          ...filteredLocalRates, 
          ...liveQuotes,
          ...(pickupPoints.length > 0 ? [{ id: 'pickup_only', name: 'Local Pickup', price: 0, type: 'pickup' }] : [])
      ].sort((a, b) => a.price - b.price); 
  }, [localRates, liveQuotes, pickupPoints]);

  // 4. Handle Method Selection
  const handleMethodClick = (methodId: string) => {
      const method = allMethods.find(m => m.id === methodId);
      if (method) {
          setSelectedMethodId(methodId);
          setOrderData({
              ...orderData,
              shippingMethod: formatServiceName(method.name),
              shippingCost: method.price,
              selectedCourierCode: method.type === 'transdirect' ? method.id : ""
          });
      }
  };


  // ==========================================
  // HANDLERS: ITEMS & COUPONS
  // ==========================================
  // ... (Your existing Item & Coupon handlers remain exactly the same)
  const handleSearchProduct = async (val: string) => {
      setSearchQuery(val);
      if (val.length > 2) {
          setSearching(true);
          const res = await searchProducts(val);
          setSearchResults(res);
          setSearching(false);
      } else {
          setSearchResults([]);
      }
  };

  const handleAddProduct = (prod: any, variant?: any) => {
      const price = variant ? variant.price : prod.price;
      const stock = variant ? variant.stock : prod.stock;
      const name = variant ? `${prod.name} - ${variant.name}` : prod.name;
      const sku = variant ? variant.sku : prod.sku;

      const existing = orderData.items.find((i) => i.productId === prod.id && i.variantId === (variant?.id || null));

      if (existing) {
          if (existing.quantity < stock) {
              const newItems = orderData.items.map((i) => 
                  (i.productId === prod.id && i.variantId === (variant?.id || null)) ? { ...i, quantity: i.quantity + 1 } : i
              );
              setOrderData({ ...orderData, items: newItems });
              toast.success("Quantity increased.");
          } else {
              toast.error("Out of stock!");
          }
      } else {
          const newItem: CartItemType = {
              productId: prod.id, variantId: variant?.id || null,
              name, price: Number(price), quantity: 1, sku,
              image: prod.featuredImage || prod.image || null,
              weight: Number(variant?.weight || prod.weight || 0),
          };
          setOrderData({ ...orderData, items: [...orderData.items, newItem] });
          toast.success("Item added.");
      }
      setSearchQuery("");
      setSearchResults([]);
  };

  const handleAddCustomItem = () => {
      if (!customItem.name || !customItem.price) return toast.error("Name and price required.");
      const newItem: CartItemType = {
          productId: null, variantId: null,
          name: customItem.name, price: parseFloat(customItem.price), quantity: parseInt(customItem.quantity) || 1, 
          sku: "CUSTOM", image: null, weight: 0
      };
      setOrderData({ ...orderData, items: [...orderData.items, newItem] });
      setCustomItem({ name: "", price: "", quantity: "1" });
      setShowCustomItem(false);
      toast.success("Custom item added.");
  };

  const handleRemoveItem = (index: number) => {
      const newItems = [...orderData.items];
      newItems.splice(index, 1);
      setOrderData({ ...orderData, items: newItems });
  };

  const updateQuantity = (index: number, newQty: number) => {
      if (newQty < 1) return;
      const newItems = [...orderData.items];
      newItems[index].quantity = newQty;
      setOrderData({ ...orderData, items: newItems });
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!couponCode) return toast.error("Enter a coupon code.");
      setApplyingCoupon(true);
      const res = await validateDiscount(couponCode, totals.subtotal);
      
      if (res.success && res.discount) {
          const discountVal = Number(res.discount.value);
          const discAmount = res.discount.type === "PERCENTAGE" ? (totals.subtotal * discountVal) / 100 : discountVal;
          setOrderData({ ...orderData, discountCode: res.discount.code, discountAmount: discAmount });
          toast.success("Coupon applied.");
          setShowCoupon(false);
          setCouponCode("");
      } else {
          toast.error(res.message || "Invalid coupon.");
      }
      setApplyingCoupon(false);
  };

  const handleRemoveCoupon = () => {
      setOrderData({ ...orderData, discountCode: "", discountAmount: 0 });
      toast.success("Coupon removed.");
  };

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mb-5 rounded-[3px]">
      
      {/* 1. Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] text-left border-collapse">
            <thead>
                <tr className="border-b border-[#f0f0f1] text-[#646970] bg-[#f6f7f7]">
                    <th className="py-2.5 px-4 font-normal w-[50%]">Item</th>
                    <th className="py-2.5 px-4 font-normal text-right">Cost</th>
                    <th className="py-2.5 px-4 font-normal text-right">Price</th>
                    <th className="py-2.5 px-4 font-normal text-center">Qty</th>
                    <th className="py-2.5 px-4 font-normal text-right">Total</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1]">
                {orderData.items.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 px-4 text-center text-[#646970]">No items added yet.</td></tr>
                ) : (
                    orderData.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#f6f7f7] group">
                            <td className="py-3 px-4">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 border border-[#c3c4c7] bg-white flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                                        {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover"/> : <Package size={16} className="text-[#a7aaad]"/>}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-[#2271b1]">{item.name}</span>
                                        <div className="text-[12px] text-[#646970] mt-0.5">
                                            <span className="font-semibold">SKU:</span> {item.sku}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="py-3 px-4 text-right text-[#a7aaad]">{formatPrice(0)}</td>
                            <td className="py-3 px-4 text-right text-[#3c434a]">{formatPrice(item.price)}</td>
                            <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateQuantity(idx, parseInt(e.target.value))} className="w-[50px] h-[28px] px-1 border border-[#8c8f94] bg-white text-center rounded-[3px] text-[13px] outline-none focus:border-[#2271b1]"/>
                                    <button onClick={(e) => { e.preventDefault(); handleRemoveItem(idx); }} className="text-[#d63638] hover:text-[#b32d2e] opacity-0 group-hover:opacity-100 transition-opacity" title="Remove"><Trash2 size={16}/></button>
                                </div>
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-[#2c3338]">{formatPrice(item.price * item.quantity)}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {/* 2. Action Buttons */}
      <div className="p-4 bg-white border-t border-[#c3c4c7]">
          <div className="flex gap-2 mb-4">
              <button type="button" onClick={() => { setShowAddItems(!showAddItems); setShowCoupon(false); setShowCustomItem(false); }} className="border border-[#2271b1] bg-white text-[#2271b1] hover:bg-[#f6f7f7] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors">Add item(s)</button>
              <button type="button" onClick={() => { setShowCoupon(!showCoupon); setShowAddItems(false); setShowCustomItem(false); }} className="border border-[#8c8f94] bg-[#f6f7f7] text-[#3c434a] hover:bg-[#f0f0f1] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors">Apply coupon</button>
          </div>

          {/* Add Items Panel */}
          {showAddItems && (
              <div className="p-3 bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] mb-4">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-[13px] font-semibold text-[#1d2327]">Search for a product</span>
                      <button type="button" onClick={() => setShowCustomItem(!showCustomItem)} className="text-[#2271b1] text-[12px] hover:underline flex items-center gap-1"><Plus size={12}/> Add Custom Item</button>
                  </div>
                  {!showCustomItem ? (
                      <div className="relative">
                          <input type="text" value={searchQuery} onChange={(e) => handleSearchProduct(e.target.value)} placeholder="Search by name or SKU..." className="w-full h-[30px] px-2 border border-[#8c8f94] bg-white text-[13px] outline-none focus:border-[#2271b1] rounded-[3px]"/>
                          {searching && <Loader2 size={14} className="absolute right-2 top-2 animate-spin text-[#2271b1]" />}
                          {searchResults.length > 0 && (
                              <div className="absolute z-[999] w-full bg-white border border-[#2271b1] shadow-lg max-h-60 overflow-y-auto mt-1 rounded-[3px]">
                                  {searchResults.map((prod) => (
                                      <div key={prod.id} className="border-b border-[#f0f0f1] last:border-0 group">
                                          <div onClick={() => handleAddProduct(prod)} className="p-2 hover:bg-[#2271b1] hover:text-white cursor-pointer transition-colors flex justify-between items-center">
                                              <span className="text-[13px] font-medium">{prod.name} <span className="opacity-70 font-normal ml-1">({prod.sku})</span></span>
                                              <span className="font-bold">{formatPrice(prod.price)}</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  ) : (
                      <div className="flex gap-2">
                          <input type="text" value={customItem.name} onChange={e=>setCustomItem({...customItem, name:e.target.value})} placeholder="Item name" className="flex-1 h-[30px] px-2 border border-[#8c8f94] bg-white text-[13px] rounded-[3px] outline-none focus:border-[#2271b1]" />
                          <input type="number" value={customItem.price} onChange={e=>setCustomItem({...customItem, price:e.target.value})} placeholder={`Price (${currency})`} className="w-24 h-[30px] px-2 border border-[#8c8f94] bg-white text-[13px] rounded-[3px] outline-none focus:border-[#2271b1]" />
                          <input type="number" value={customItem.quantity} onChange={e=>setCustomItem({...customItem, quantity:e.target.value})} min="1" placeholder="Qty" className="w-16 h-[30px] px-2 border border-[#8c8f94] bg-white text-[13px] rounded-[3px] outline-none focus:border-[#2271b1]" />
                          <button type="button" onClick={handleAddCustomItem} className="bg-[#2271b1] text-white px-3 h-[30px] rounded-[3px] text-[12px] font-medium">Add</button>
                      </div>
                  )}
              </div>
          )}

          {/* Apply Coupon Panel */}
          {showCoupon && (
              <form onSubmit={handleApplyCoupon} className="p-3 bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] mb-4 flex gap-2 w-full md:w-1/2">
                  <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code..." className="flex-1 h-[30px] px-2 border border-[#8c8f94] bg-white text-[13px] outline-none focus:border-[#2271b1] rounded-[3px] uppercase font-mono"/>
                  <button type="submit" disabled={applyingCoupon} className="bg-[#f0f0f1] border border-[#8c8f94] text-[#3c434a] hover:bg-[#e2e4e7] px-4 h-[30px] rounded-[3px] text-[13px] font-medium disabled:opacity-50">
                      {applyingCoupon ? "Applying..." : "Apply"}
                  </button>
              </form>
          )}
          
      </div>

      {/* 3. Pricing Totals */}
      <div className="border-t border-[#c3c4c7] bg-[#f6f7f7] px-4 py-4 flex flex-col md:flex-row justify-end items-end">
          <div className="w-full md:w-[320px] text-[13px] text-[#3c434a]">
              <table className="w-full text-right">
                  <tbody>
                      <tr>
                          <td className="py-1.5 text-[#646970]">Items Subtotal:</td>
                          <td className="py-1.5 font-medium">{formatPrice(totals.subtotal)}</td>
                      </tr>
                      {orderData.discountAmount > 0 && (
                          <tr className="group relative">
                              <td className="py-1.5 text-[#646970] flex justify-end items-center gap-1">
                                  Discount: <span className="font-mono text-[#d63638] bg-red-50 px-1 border border-red-100 rounded">{orderData.discountCode}</span>
                                  <button type="button" onClick={handleRemoveCoupon} className="text-[#d63638] opacity-0 group-hover:opacity-100"><X size={12}/></button>
                              </td>
                              <td className="py-1.5 text-[#d63638] font-medium">-{formatPrice(orderData.discountAmount)}</td>
                          </tr>
                      )}
                      <tr>
                          <td className="py-1.5 text-[#646970] flex items-center justify-end gap-2">
                              Shipping:
                              <input type="number" value={orderData.shippingCost} onChange={(e) => setOrderData({...orderData, shippingCost: parseFloat(e.target.value) || 0})} className="w-[70px] h-[24px] px-1 border border-[#8c8f94] bg-white text-right outline-none rounded-[3px]"/>
                          </td>
                          <td className="py-1.5 font-medium">{formatPrice(orderData.shippingCost)}</td>
                      </tr>
                      {totals.taxTotal > 0 && (
                          <tr>
                              <td className="py-1.5 text-[#646970]">Tax:</td>
                              <td className="py-1.5 font-medium">{formatPrice(totals.taxTotal)}</td>
                          </tr>
                      )}
                      <tr className="border-t border-[#e2e4e7]">
                          <td className="py-2.5 font-semibold text-[#1d2327]">Order Total:</td>
                          <td className="py-2.5 font-bold text-[#1d2327] text-[14px]">{formatPrice(totals.finalTotal)}</td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};