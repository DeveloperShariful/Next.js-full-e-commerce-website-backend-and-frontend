// File: app/(storefront)/checkout/_components/payment/gateways/Paypal_Wrapper.tsx

"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Paypal_Buttons } from "./Paypal_Buttons";
import { Loader2 } from "lucide-react";

interface PaypalWrapperProps {
  cartId: string;
  settings: any; // PayPalConfig from DB
  currency: string;
}

export const Paypal_Wrapper = ({ cartId, settings, currency }: PaypalWrapperProps) => {
  // কনফিগারেশন চেক
  const clientId = settings?.sandbox ? settings.sandboxClientId : settings.liveClientId;

  if (!clientId) {
    return <div className="text-red-500 text-sm p-4">PayPal configuration missing.</div>;
  }

  const initialOptions = {
    clientId: clientId,
    currency: currency || "AUD",
    intent: settings.intent?.toLowerCase() || "capture",
    // স্টাইলিং বা অ্যাডভান্সড অপশনস (যেমন PayLater) এখানে পাস করা যায়
    "enable-funding": "paylater",
    "disable-funding": settings.disableFunding?.join(",") || "card", // কার্ড বাটন হাইড করা যদি অ্যাডমিন চায়
  };

  return (
    <div className="mt-4 animate-in fade-in">
      <PayPalScriptProvider options={initialOptions}>
        <div className="min-h-[150px] flex flex-col justify-center">
           {/* লোডিং স্টেট হ্যান্ডেল করবে লাইব্রেরি নিজেই, তবে আমরা একটি ফলব্যাক রাখতে পারি */}
           <Paypal_Buttons cartId={cartId} />
        </div>
      </PayPalScriptProvider>
    </div>
  );
};