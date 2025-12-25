// File Location: app/admin/orders/create/_components/order-summary.tsx

"use client"

import { Input } from "@/components/ui/input";

interface OrderSummaryProps {
    subtotal: number;
    shippingCost: number;
    setShippingCost: (val: number) => void;
    discount: number;
    tax: number; 
    total: number;
    currencySymbol?: string;
}

export const OrderSummary = ({ 
    subtotal, 
    shippingCost, 
    setShippingCost, 
    discount, 
    tax, // 👈 এখানে tax রিসিভ করা হচ্ছে
    total,
    currencySymbol = "$" 
}: OrderSummaryProps) => {
    return (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-700 uppercase mb-2">Order Summary</h3>
            
            <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm items-center">
                <span className="text-slate-600">Shipping</span>
                <Input 
                    type="number" 
                    className="w-24 h-7 text-right text-xs" 
                    value={shippingCost} 
                    onChange={e => setShippingCost(Number(e.target.value))}
                    min={0}
                />
            </div>
            
            <div className="flex justify-between text-sm items-center">
                <span className="text-slate-600">Discount</span>
                <span className="text-red-600 font-medium">-{currencySymbol}{discount.toFixed(2)}</span>
            </div>

            {/* 👇 Tax Row যোগ করা হয়েছে */}
            <div className="flex justify-between text-sm items-center">
                <span className="text-slate-600">Tax (GST 10%)</span>
                <span className="font-medium">{currencySymbol}{tax.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between font-bold text-lg pt-3 border-t border-slate-100 mt-2">
                <span>Total</span>
                <span>{currencySymbol}{total.toFixed(2)}</span>
            </div>
        </div>
    );
};