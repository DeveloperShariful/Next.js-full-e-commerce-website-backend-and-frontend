// File Location: app/admin/orders/create/_components/gift-card-input.tsx

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateGiftCard } from "@/app/actions/admin/order/create_order/validate-gift-card";
import { toast } from "sonner";
import { Gift, Loader2, X } from "lucide-react";

interface GiftCardInputProps {
    onApply: (giftCard: any) => void;
    onRemove: () => void;
    appliedCard: any;
}

export const GiftCardInput = ({ onApply, onRemove, appliedCard }: GiftCardInputProps) => {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleApply = async () => {
        if (!code) return toast.error("Enter a gift card code");
        
        setLoading(true);
        const res = await validateGiftCard(code);
        
        if (res.success) {
            onApply(res.data);
            setCode("");
            toast.success("Gift card applied successfully!");
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    if (appliedCard) {
        return (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-purple-900">
                    <Gift size={16} />
                    <span>Card <strong>{appliedCard.code}</strong> applied</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-700 bg-white px-2 py-1 rounded border border-purple-100">
                        -${appliedCard.balance}
                    </span>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-purple-400 hover:text-red-500" onClick={onRemove}>
                        <X size={14}/>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 tracking-wider">
                    <Gift size={12} className="text-purple-500"/> Pay with Gift Card
                </label>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Gift Card Code" 
                        value={code} 
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="h-9 text-xs font-mono"
                    />
                    <Button 
                        size="sm" 
                        onClick={handleApply} 
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 text-white w-20"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin"/> : "Apply"}
                    </Button>
                </div>
            </div>
        </div>
    );
};