//app/(storefront)/affiliates/finance/payouts/_components/payout-trigger.tsx

"use client";

import { useState } from "react";
import PayoutRequestModal from "./payout-request-modal";

interface Props {
  userId: string;
  balance: number;
  config: {
    minimumPayout: number;
    payoutMethods: string[];
  };
}

export default function PayoutTrigger({ userId, balance, config }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        disabled={balance < config.minimumPayout}
      >
        Request Payout
      </button>

      <PayoutRequestModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        userId={userId}
        balance={balance}
        config={config}
      />
    </>
  );
}