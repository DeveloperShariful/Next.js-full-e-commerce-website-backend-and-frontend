// File: app/admin/settings/payments/_components/Payment_Config_Modal.tsx

"use client";

import { PaymentMethod } from "../types"; // Path fix
import { X } from "lucide-react";

// Import Specific Method Components
import Bank_Payment from "./Payment_Methods/Bank_Payment";
import Check_Payment from "./Payment_Methods/Check_Payment";
import CashOn_Delivery from "./Payment_Methods/CashOn_Delivery";
import Stripe_Settings from "./Payment_Methods/Stripe/Stripe_Settings";
import Paypal_Settings from "./Payment_Methods/Paypal/Paypal_Settings";

interface Props {
    method: PaymentMethod;
    onClose: () => void;
    refreshData: () => void;
}

export default function Payment_Config_Modal({ method, onClose, refreshData }: Props) {
    const renderContent = () => {
        switch (method.identifier) {
            case 'bacs':
                return <Bank_Payment method={method} onBack={onClose} refreshData={refreshData} />;
            case 'cheque':
                return <Check_Payment method={method} onBack={onClose} refreshData={refreshData} />;
            case 'cod':
                return <CashOn_Delivery method={method} onBack={onClose} refreshData={refreshData} />;
            case 'stripe':
                return <Stripe_Settings method={method} onBack={onClose} refreshData={refreshData} />;
            case 'paypal':
                return <Paypal_Settings method={method} onBack={onClose} refreshData={refreshData} />;
            default:
                return <div className="p-6 text-slate-500">Configuration not available.</div>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
                    <h3 className="text-lg font-bold text-slate-800">{method.name}</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                </div>
                {renderContent()}
            </div>
        </div>
    );
}