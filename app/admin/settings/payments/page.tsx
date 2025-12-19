// File: app/admin/settings/payments/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getPaymentMethods, seedPaymentMethods } from "@/app/actions/settings/payments/general";
import { PaymentMethod } from "./types";
import { Loader2, CreditCard } from "lucide-react";
import Payment_Methods_List from "./_components/Payment_Methods_List";
import { toast } from "react-hot-toast";

export default function PaymentsPage() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const res = await getPaymentMethods();
        if (res.success) {
            setMethods(res.data as unknown as PaymentMethod[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSeed = async () => {
        setLoading(true);
        const res = await seedPaymentMethods();
        if (res.success) {
            toast.success("Default methods restored");
            fetchData();
        } else {
            toast.error("Failed to seed methods");
            setLoading(false);
        }
    };

    if (loading) return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <CreditCard className="text-[#2271b1]"/> Payments
                </h1>
                {methods.length === 0 && (
                    <button onClick={handleSeed} className="text-sm text-[#2271b1] underline hover:text-blue-800">
                        Restore Default Payment Methods
                    </button>
                )}
            </div>

            <Payment_Methods_List methods={methods} refreshData={fetchData} />
        </div>
    );
}