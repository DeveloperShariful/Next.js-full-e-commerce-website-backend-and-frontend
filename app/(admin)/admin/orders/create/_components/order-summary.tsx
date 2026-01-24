// File Location: app/admin/orders/create/_components/order-summary.tsx

"use client"

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrderSummaryProps {
    subtotal: number;
    shippingCost: number;
    setShippingCost: (val: number) => void;
    discount: number;
    tax: number; 
    taxName: string;
    taxRate: number;
    total: number;
    currencySymbol?: string;
    paymentMethod: string;
    setPaymentMethod: (val: string) => void;
}

export const OrderSummary = ({ 
    subtotal, 
    shippingCost, 
    setShippingCost, 
    discount, 
    tax, 
    taxName,
    taxRate,
    total,
    currencySymbol = "$",
    paymentMethod,
    setPaymentMethod
}: OrderSummaryProps) => {
    return (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-700 uppercase mb-2">Order Summary</h3>
            
            <div className="space-y-3 pb-3 border-b border-slate-100">
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

                <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-600">{taxName} ({taxRate}%)</span>
                    <span className="font-medium">{currencySymbol}{tax.toFixed(2)}</span>
                </div>
            </div>
            
            <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{currencySymbol}{total.toFixed(2)}</span>
            </div>

            <div className="pt-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-9 text-xs mt-1 bg-slate-50 border-slate-200">
                        <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Manual">Manual / Unknown</SelectItem>
                        <SelectItem value="Cash">Cash on Delivery</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="POS">POS Terminal</SelectItem>
                        <SelectItem value="External Card">External Card Link</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};