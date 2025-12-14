// app/(routes)/checkout/page.tsx

"use client";

import { useState, useEffect } from "react";
import useCart from "@/hooks/use-cart";
import { placeOrder } from "@/app/actions/checkout";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Loader2, Lock, Truck, CreditCard, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zone: "Inside Dhaka", // Default
  });

  useEffect(() => {
    setMounted(true);
    // ডিফল্ট শিপিং সেট করা
    cart.setShippingCost(60); 
  }, []);

  if (!mounted) return null;

  if (cart.items.length === 0) {
    router.push("/cart");
    return null;
  }

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const zone = e.target.value;
    setFormData({ ...formData, zone });
    
    // Simple logic for demo (Later fetch from DB)
    if (zone === "Inside Dhaka") cart.setShippingCost(60);
    else cart.setShippingCost(120);
  };

  const onPlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const orderPayload = {
      email: formData.email,
      shippingAddress: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address1: formData.address,
        city: formData.city,
        phone: formData.phone,
        country: "Bangladesh"
      },
      subtotal: cart.getSubtotal(),
      shippingCost: cart.shippingCost,
      discount: cart.discountAmount,
      total: cart.getTotal()
    };

    const res = await placeOrder(orderPayload, cart.items);

    if (res.success) {
      cart.removeAll(); // কার্ট খালি করা
      toast.success(`Order #${res.orderNumber} placed successfully!`);
      // সাকসেস পেজে রিডাইরেক্ট (যদি চান) বা অর্ডারে
      router.push("/orders"); 
    } else {
      toast.error("Something went wrong.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-8 text-center">Checkout</h1>

        <form onSubmit={onPlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: SHIPPING FORM */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Truck className="text-blue-600"/> Shipping Details
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">First Name</label>
                   <input required type="text" className="w-full border p-2.5 rounded-lg mt-1 outline-none focus:border-blue-500" 
                     onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Last Name</label>
                   <input required type="text" className="w-full border p-2.5 rounded-lg mt-1 outline-none focus:border-blue-500"
                     onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                   <input required type="email" className="w-full border p-2.5 rounded-lg mt-1 outline-none focus:border-blue-500"
                     onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                   <input required type="text" className="w-full border p-2.5 rounded-lg mt-1 outline-none focus:border-blue-500"
                     onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div className="mb-4">
                 <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                 <input required type="text" placeholder="House no, Road no..." className="w-full border p-2.5 rounded-lg mt-1 outline-none focus:border-blue-500"
                   onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">City</label>
                   <input required type="text" className="w-full border p-2.5 rounded-lg mt-1 outline-none focus:border-blue-500"
                     onChange={e => setFormData({...formData, city: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Zone</label>
                   <select className="w-full border p-2.5 rounded-lg mt-1 bg-white outline-none focus:border-blue-500"
                     onChange={handleZoneChange}
                   >
                      <option value="Inside Dhaka">Inside Dhaka</option>
                      <option value="Outside Dhaka">Outside Dhaka</option>
                   </select>
                 </div>
              </div>
            </div>

            {/* Payment Method (Visual Only for now) */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CreditCard className="text-blue-600"/> Payment Method
                </h2>
                <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-blue-600 border border-white ring-2 ring-blue-200"></div>
                    <span className="font-bold text-slate-800">Cash On Delivery (COD)</span>
                </div>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className="lg:col-span-5">
             <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm sticky top-24">
                <h2 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Your Order</h2>
                
                <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                    {cart.items.map((item) => (
                        <div key={item.cartItemId} className="flex gap-4">
                            <div className="relative w-16 h-16 bg-slate-100 rounded-md overflow-hidden flex-shrink-0 border">
                                <Image src={item.image} alt={item.name} fill className="object-cover"/>
                                <span className="absolute top-0 right-0 bg-slate-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-bl-md font-bold">
                                    {item.quantity}
                                </span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</p>
                                <p className="text-xs text-slate-500">{item.selectedVariantName || "Standard"}</p>
                            </div>
                            <div className="text-sm font-bold text-slate-700">
                                ৳{item.price * item.quantity}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-4 text-sm">
                    <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span>৳{cart.getSubtotal()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>Shipping</span>
                        <span>৳{cart.shippingCost}</span>
                    </div>
                    {cart.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-৳{cart.discountAmount}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t">
                        <span>Total</span>
                        <span>৳{cart.getTotal()}</span>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full mt-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {loading ? <Loader2 className="animate-spin"/> : <CheckCircle2/>} 
                    Place Order
                </button>

                <p className="text-xs text-center text-slate-400 mt-4 flex items-center justify-center gap-1">
                    <Lock size={12}/> All transactions are secure and encrypted.
                </p>
             </div>
          </div>

        </form>
      </div>
    </div>
  );
}