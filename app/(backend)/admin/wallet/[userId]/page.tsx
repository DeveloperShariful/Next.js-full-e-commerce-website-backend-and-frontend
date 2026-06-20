// app/(backend)/admin/wallet/[userId]/page.tsx

import { getWalletByUserId } from "@/app/actions/backend/wallet/wallet-actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";
import WalletAdjustForm from "./_components/WalletAdjustForm";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function UserWalletPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const wallet = await getWalletByUserId(userId);

  if (!wallet) notFound();

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/wallet"
          className="flex items-center gap-1 text-[13px] text-[#2271b1] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Wallets
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left: User Info + Balance + Adjust */}
        <div className="lg:col-span-1 space-y-4">

          {/* User Card */}
          <div className="bg-white border border-[#c3c4c7] p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[#f0f0f1]">
              {wallet.user.image ? (
                <img src={wallet.user.image} className="w-10 h-10 rounded-full object-cover border border-[#c3c4c7]" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#2271b1] flex items-center justify-center text-white font-bold text-[16px]">
                  {(wallet.user.name || wallet.user.email)[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-[14px] text-[#1d2327]">{wallet.user.name || "—"}</p>
                <p className="text-[12px] text-[#50575e]">{wallet.user.email}</p>
              </div>
            </div>
            <div className="text-center py-3">
              <p className="text-[11px] text-[#8c8f94] uppercase font-bold tracking-wider mb-1">Current Balance</p>
              <p className="text-[32px] font-mono font-normal text-[#1d2327]">
                A${Number(wallet.balance).toFixed(2)}
              </p>
              <p className="text-[12px] text-[#50575e] mt-1">{wallet.points} points</p>
            </div>
          </div>

          {/* Adjust Balance Form */}
          <WalletAdjustForm userId={userId} currentBalance={Number(wallet.balance)} />
        </div>

        {/* Right: Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#c3c4c7] shadow-sm">
            <div className="px-4 py-3 border-b border-[#c3c4c7] bg-[#f0f0f1] flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#2271b1]" />
              <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">
                Transaction History ({wallet.transactions.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px] border-collapse">
                <thead className="bg-[#f0f0f1] border-b border-[#c3c4c7]">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-[#2c3338]">Type</th>
                    <th className="px-4 py-2 text-left font-semibold text-[#2c3338]">Description</th>
                    <th className="px-4 py-2 text-right font-semibold text-[#2c3338]">Amount</th>
                    <th className="px-4 py-2 text-right font-semibold text-[#2c3338]">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f1]">
                  {wallet.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-[#50575e] italic">
                        No transactions yet.
                      </td>
                    </tr>
                  ) : (
                    wallet.transactions.map((tx) => {
                      const isCredit = tx.type === "AFFILIATE_COMMISSION" || tx.type === "MLM_BONUS" || tx.type === "ADJUSTMENT";
                      return (
                        <tr key={tx.id} className="hover:bg-[#f6f7f7] transition-colors">
                          <td className="px-4 py-3">
                            <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase border ${
                              isCredit
                                ? "bg-[#f0f6fc] text-[#00a32a] border-[#00a32a]/20"
                                : "bg-[#fcf0f1] text-[#d63638] border-[#d63638]/20"
                            }`}>
                              {tx.type.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#50575e]">
                            {tx.description || "—"}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono font-bold ${isCredit ? "text-[#00a32a]" : "text-[#d63638]"}`}>
                            {isCredit ? "+" : "-"}A${Number(tx.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-[#8c8f94] text-[12px]">
                            {format(new Date(tx.createdAt), "dd/MM/yyyy")}
                            <div className="text-[11px]">{format(new Date(tx.createdAt), "hh:mm a")}</div>
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
      </div>
    </div>
  );
}
