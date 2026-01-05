// File Location: app/admin/orders/create/_components/coupon.tsx

"use client"

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateDiscount } from "@/app/actions/admin/order/create_order/validate-discount";
import { toast } from "sonner";
import { Tag } from "lucide-react";

interface CouponProps {
    cartSubtotal: number;
    onApplyDiscount: (discount: any) => void;
}

export const Coupon = ({ cartSubtotal, onApplyDiscount }: CouponProps) => {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [applied, setApplied] = useState(false);

    const handleApply = async () => {
        if (!code) return toast.error("Please enter a code");
        
        setLoading(true);
        try {
            const res = await validateDiscount(code, cartSubtotal);
            if (res.success) {
                onApplyDiscount(res.discount);
                setApplied(true);
                toast.success(`Success! ${res.discount?.code} applied.`);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Failed to validate coupon");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 tracking-wider">
                    <Tag size={12} className="text-blue-500"/> Apply Coupon
                </label>
                <div className="flex gap-2">
                    <Input 
                        placeholder="e.g. SAVE10" 
                        value={code} 
                        disabled={applied}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="h-9 text-xs font-mono"
                    />
                    <Button 
                        size="sm" 
                        variant={applied ? "outline" : "default"}
                        onClick={handleApply} 
                        disabled={loading || applied}
                        className={applied ? "text-green-600 border-green-200" : "bg-slate-900"}
                    >
                        {applied ? "Applied" : "Apply"}
                    </Button>
                </div>
            </div>
        </div>
    );
};