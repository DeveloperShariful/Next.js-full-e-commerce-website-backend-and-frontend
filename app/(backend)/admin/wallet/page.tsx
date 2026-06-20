// app/(backend)/admin/wallet/page.tsx

import { getWalletList } from "@/app/actions/backend/wallet/wallet-actions";
import Link from "next/link";
import { Wallet, Search, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminWalletPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";

  const { wallets, total, totalPages } = await getWalletList(page, search);

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[23px] font-normal text-[#1d2327]">Customer Wallets</h1>
          <p className="text-[13px] text-[#50575e] mt-0.5">
            {total} wallets found
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#c3c4c7] px-4 py-2 rounded shadow-sm">
          <Wallet className="w-4 h-4 text-[#2271b1]" />
          <span className="text-[13px] font-semibold text-[#1d2327]">
            Total Credits: A${totalBalance.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-[#c3c4c7] p-3 mb-4 flex gap-2 shadow-sm">
        <form className="flex gap-2 w-full max-w-md" method="GET">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8f94]" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by name or email..."
              className="w-full pl-8 pr-3 py-1.5 border border-[#8c8f94] rounded-sm text-[13px] outline-none focus:border-[#2271b1]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-[#2271b1] text-white text-[13px] rounded-sm hover:bg-[#135e96] transition-colors"
          >
            Search
          </button>
          {search && (
            <Link
              href="/admin/wallet"
              className="px-3 py-1.5 border border-[#c3c4c7] text-[13px] rounded-sm hover:bg-[#f0f0f1] transition-colors text-[#50575e]"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-x-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead className="bg-[#f0f0f1] border-b border-[#c3c4c7]">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold text-[#2c3338]">Customer</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#2c3338]">Email</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#2c3338]">Role</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#2c3338]">Balance</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#2c3338]">Points</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#2c3338]">Transactions</th>
              <th className="px-4 py-2.5 text-center font-semibold text-[#2c3338]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {wallets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#50575e]">
                  <Users className="w-8 h-8 mx-auto mb-2 text-[#c3c4c7]" />
                  No wallets found.
                </td>
              </tr>
            ) : (
              wallets.map((w) => (
                <tr key={w.id} className="hover:bg-[#f6f7f7] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {w.user.image ? (
                        <img src={w.user.image} className="w-7 h-7 rounded-full object-cover border border-[#c3c4c7]" alt="" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#2271b1] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                          {(w.user.name || w.user.email)[0].toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-[#1d2327]">{w.user.name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#50575e]">{w.user.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-[#f0f6fc] text-[#2271b1] border border-[#2271b1]/20 rounded-sm text-[11px] font-bold uppercase">
                      {w.user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-[#1d2327]">
                    A${Number(w.balance).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#50575e]">{w.points}</td>
                  <td className="px-4 py-3 text-right text-[#50575e]">{w._count.transactions}</td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/admin/wallet/${w.user.id}`}
                      className="inline-flex items-center px-3 py-1 bg-[#2271b1] text-white text-[12px] rounded-sm hover:bg-[#135e96] transition-colors font-semibold"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-4 justify-end">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/wallet?page=${p}${search ? `&search=${search}` : ""}`}
              className={`px-3 py-1 text-[13px] border rounded-sm transition-colors ${
                p === page
                  ? "bg-[#2271b1] text-white border-[#2271b1]"
                  : "bg-white text-[#2271b1] border-[#c3c4c7] hover:bg-[#f0f0f1]"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
