"use client";

import { useState, useEffect } from "react";
import useCart from "@/hooks/use-cart";
// [FIXED] 'placeOrder' এর বদলে 'processCheckout' হবে
import { processCheckout } from "@/app/actions/checkout"; 
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Loader2, Lock, Truck, CreditCard, CheckCircle2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  // Form States
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const total = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const onCheckout = async () => {
    if (!user) {
      toast.error("Please login first");
      router.push("/sign-in");
      return;
    }
    if (!address || !phone || !city) {
      toast.error("Please fill all shipping details");
      return;
    }

    setLoading(true);

    // Prepare Data
    const checkoutData = {
      items: cart.items.map(item => ({
        productId: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        variantId: item.variantId // যদি ভেরিয়েন্ট থাকে
      })),
      total: total,
      paymentMethod: "COD", // Cash on Delivery
      shippingAddress: {
        address,
        phone,
        city,
        name: user.fullName || "Guest"
      }
    };

    // [FIXED] Call 'processCheckout' instead of 'placeOrder'
    const res = await processCheckout(checkoutData);

    setLoading(false);

    if (res.success) {
      toast.success("Order placed successfully! 🎉");
      cart.removeAll(); // Clear cart
      router.push("/orders"); // Redirect to orders page
    } else {
      toast.error(res.message || "Something went wrong");
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Your cart is empty</h2>
        <button onClick={() => router.push("/shop")} className="text-blue-600 hover:underline">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-2">
        <Lock size={24} className="text-green-600"/> Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Shipping Form */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                 <Truck className="text-blue-600"/> Shipping Details
              </h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-sm font-bold text-slate-600 block mb-1">Full Address</label>
                    <textarea 
                      value={address} onChange={(e) => setAddress(e.target.value)}
                      className="w-full border p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="House, Road, Area..."
                      rows={2}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-bold text-slate-600 block mb-1">City</label>
                        <input 
                          value={city} onChange={(e) => setCity(e.target.value)}
                          className="w-full border p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          placeholder="Dhaka"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-slate-600 block mb-1">Phone</label>
                        <input 
                          value={phone} onChange={(e) => setPhone(e.target.value)}
                          className="w-full border p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          placeholder="017..."
                        />
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                 <CreditCard className="text-blue-600"/> Payment Method
              </h3>
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-blue-50 border-blue-200">
                 <CheckCircle2 className="text-blue-600" size={20}/>
                 <span className="font-bold text-slate-800">Cash on Delivery</span>
              </div>
           </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24">
              <h3 className="font-bold text-lg mb-4">Order Summary</h3>
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                 {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                       <span className="text-slate-600">{item.name} x {item.quantity}</span>
                       <span className="font-bold">৳{Number(item.price) * item.quantity}</span>
                    </div>
                 ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-bold">৳{total}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Shipping</span>
                    <span className="font-bold text-green-600">Free</span>
                 </div>
                 <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>৳{total}</span>
                 </div>
              </div>

              <button 
                onClick={onCheckout}
                disabled={loading}
                className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-70 flex justify-center gap-2"
              >
                 {loading && <Loader2 className="animate-spin"/>} Place Order
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}