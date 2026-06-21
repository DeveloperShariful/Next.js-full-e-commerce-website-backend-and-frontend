// File: app/(frontend)/my-account/_components/wallet-view.tsx

"use client";

import { useState } from "react";
import { Wallet, Ticket, FileText, ArrowDownLeft, ArrowUpRight, Copy, Check } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string | Date;
  referenceId: string | null;
}

interface Props {
  data: {
    wallet?: {
      balance: number;
      points: number;
      transactions: TransactionItem[];
    }
  }
}

export default function WalletView({ data }: Props) {
  const { formatPrice } = useGlobalStore();
  const [giftCode, setGiftCode] = useState("");
  const [loading, setLoading] = useState(false);

  const wallet = data.wallet || { balance: 0, points: 0, transactions: [] };

  const handleRedeemGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCode) return toast.error("Please enter a gift card code.");
    setLoading(true);

    // Mock API call to redeem gift card
    setTimeout(() => {
      toast.success("Gift card redeemed successfully! Store credit added.");
      setGiftCode("");
      setLoading(false);
      window.location.reload();
    }, 1500);
  };

  const getTxConfig = (type: string) => {
     if (type === "AFFILIATE_COMMISSION" || type === "ADJUSTMENT") {
         return { color: "text-[#00a32a]", bg: "bg-[#f0f6fc] border-[#00a32a]/20", sign: "+", label: "Earnings" };
     }
     return { color: "text-[#d63638]", bg: "bg-[#fcf0f1] border-[#d63638]/20", sign: "-", label: "Debit" };
  };

  return (
    <div className="space-y-6 font-sans text-[#1d2327] animate-in fade-in duration-300">
      
      {/* Wallet Balance Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#c3c4c7] p-5 flex items-center justify-between">
            <div>
                <p className="text-[11px] text-[#8c8f94] uppercase font-bold tracking-wider m-0">Store Credit Balance</p>
                <h3 className="text-[28px] font-mono font-normal text-[#1d2327] m-0 mt-1 leading-none">{formatPrice(wallet.balance)}</h3>
            </div>
            <div className="p-3 bg-[#f0f6fc] border border-[#2271b1]/20 text-[#2271b1]">
                <Wallet className="w-6 h-6" />
            </div>
        </div>

        {/* Gift Card Redeem Metabox */}
        <div className="bg-white border border-[#c3c4c7] p-4 flex flex-col justify-center">
            <h4 className="text-[13px] font-semibold text-[#1d2327] m-0 mb-2 flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-[#50575e]" /> Redeem Gift Card
            </h4>
            <form onSubmit={handleRedeemGiftCard} className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Enter Gift Card Code" 
                    value={giftCode}
                    onChange={e => setGiftCode(e.target.value.toUpperCase())}
                    className="flex-1 border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px] uppercase outline-none focus:border-[#2271b1]"
                />
                <button type="submit" disabled={loading} className="px-4 py-1 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded-sm font-semibold disabled:opacity-50 transition-colors">
                    {loading ? "Redeeming..." : "Redeem"}
                </button>
            </form>
        </div>
      </div>

      {/* Wallet Transactions List */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm">
        <div className="px-4 py-3 border-b border-[#c3c4c7] bg-[#f0f0f1]">
          <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Wallet Transaction History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#f0f0f1] border-b border-[#c3c4c7] text-[#2c3338]">
              <tr>
                <th className="px-4 py-2 font-semibold">Type</th>
                <th className="px-4 py-2 font-semibold">Description</th>
                <th className="px-4 py-2 font-semibold text-right">Amount</th>
                <th className="px-4 py-2 text-right font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1] bg-white">
              {wallet.transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#50575e] italic">
                     <FileText className="w-8 h-8 text-[#c3c4c7] mx-auto mb-2" />
                     No transactions logged yet.
                  </td>
                </tr>
              ) : (
                wallet.transactions.map((tx: any) => {
                  const config = getTxConfig(tx.type);
                  const refParts = tx.reference?.split('|') || [];
                  const displayRef = refParts[0] || tx.reference;

                  return (
                    <tr key={tx.id} className="hover:bg-[#f6f7f7] transition-colors">
                      <td className="px-4 py-3">
                         <span className={cn("px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase border", config.bg, config.color)}>
                            {config.label}
                         </span>
                      </td>
                      <td className="px-4 py-3">
                        <strong className="text-[#1d2327] font-semibold">{tx.description || "Credit update"}</strong>
                        <div className="text-[10px] text-[#8c8f94] font-mono mt-0.5">Ref ID: {displayRef}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <span className={cn("font-bold text-[14px]", config.color)}>
                            {config.sign}{formatPrice(Number(tx.amount))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#50575e] text-[12px]">
                        <div>{format(new Date(tx.createdAt), "Y/m/d")}</div>
                        <div className="text-[11px] text-[#8c8f94] font-mono">{format(new Date(tx.createdAt), "g:i a")}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}