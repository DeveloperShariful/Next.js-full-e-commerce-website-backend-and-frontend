// app/(backend)/admin/subscriptions/page.tsx

import { getSubscriptionList } from "@/app/actions/backend/subscriptions/subscription-actions";
import Link from "next/link";
import { RefreshCw, Search, Users, Package } from "lucide-react";
import { formatTz } from "@/lib/store-time";
import { getStoreTimezone } from "@/lib/get-store-timezone";
import StatusSelect from "./_components/StatusSelect";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/30",
  PAUSED: "bg-[#fcf9e8] text-[#bd8600] border-[#bd8600]/30",
  CANCELLED: "bg-[#fcf0f1] text-[#d63638] border-[#d63638]/30",
  EXPIRED: "bg-[#f0f0f1] text-[#50575e] border-[#c3c4c7]",
  PAST_DUE: "bg-[#fcf0f1] text-[#d63638] border-[#d63638]/30",
  TRIALLING: "bg-[#f0f6fc] text-[#2271b1] border-[#2271b1]/30",
};

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const status = params.status || "";

  const { subscriptions, total, totalPages, statusCounts } = await getSubscriptionList(
    page,
    search,
    status
  );
  const timezone = await getStoreTimezone();

  const countFor = (s: string) =>
    statusCounts.find((c) => c.status === s)?._count._all || 0;

  const buildHref = (overrides: Record<string, string | number>) => {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (status) sp.set("status", status);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === "" || v === 0) sp.delete(k);
      else sp.set(k, String(v));
    });
    const qs = sp.toString();
    return `/admin/subscriptions${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[23px] font-normal text-[#1d2327]">Subscriptions</h1>
          <p className="text-[13px] text-[#50575e] mt-0.5">{total} subscriptions found</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-[13px]">
        <Link
          href={buildHref({ status: "", page: "" })}
          className={`px-3 py-1 rounded-sm border transition-colors ${
            !status
              ? "bg-[#2271b1] text-white border-[#2271b1]"
              : "bg-white text-[#2271b1] border-[#c3c4c7] hover:bg-[#f0f0f1]"
          }`}
        >
          All
        </Link>
        {["ACTIVE", "PAUSED", "CANCELLED", "EXPIRED", "PAST_DUE", "TRIALLING"].map((s) => (
          <Link
            key={s}
            href={buildHref({ status: s, page: "" })}
            className={`px-3 py-1 rounded-sm border transition-colors flex items-center gap-1.5 ${
              status === s
                ? "bg-[#2271b1] text-white border-[#2271b1]"
                : "bg-white text-[#50575e] border-[#c3c4c7] hover:bg-[#f0f0f1]"
            }`}
          >
            {s.replace(/_/g, " ")}
            <span
              className={`text-[11px] px-1.5 rounded-full ${
                status === s ? "bg-white/20 text-white" : "bg-[#f0f0f1] text-[#50575e]"
              }`}
            >
              {countFor(s)}
            </span>
          </Link>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white border border-[#c3c4c7] p-3 mb-4 flex gap-2 shadow-sm">
        <form className="flex gap-2 w-full max-w-md" method="GET">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8f94]" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by customer name or email..."
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
              href={buildHref({ search: "", page: "" })}
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
              <th className="px-4 py-2.5 text-left font-semibold text-[#2c3338]">Plan</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#2c3338]">Price</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#2c3338]">Next Billing</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#2c3338]">Period End</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#2c3338]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#50575e]">
                  <Users className="w-8 h-8 mx-auto mb-2 text-[#c3c4c7]" />
                  No subscriptions found.
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#f6f7f7] transition-colors align-top">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {sub.user.image ? (
                        <img
                          src={sub.user.image}
                          className="w-7 h-7 rounded-full object-cover border border-[#c3c4c7]"
                          alt=""
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#2271b1] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                          {(sub.user.name || sub.user.email)[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/admin/wallet/${sub.user.id}`}
                          className="font-semibold text-[#2271b1] hover:underline block truncate"
                        >
                          {sub.user.name || "—"}
                        </Link>
                        <span className="text-[12px] text-[#50575e] block truncate">
                          {sub.user.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[#1d2327]">
                      <Package className="w-3.5 h-3.5 text-[#8c8f94] shrink-0" />
                      {sub.plan.name}
                    </div>
                    <span className="text-[11px] text-[#8c8f94]">
                      every {sub.plan.intervalCount} {sub.plan.interval.toLowerCase()}
                      {sub.plan.intervalCount > 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-[#1d2327] whitespace-nowrap">
                    {sub.plan.currency === "AUD" ? "A$" : sub.plan.currency + " "}
                    {Number(sub.plan.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-[#50575e] whitespace-nowrap">
                    {formatTz(new Date(sub.nextBillingDate), timezone, "dd/MM/yyyy")}
                  </td>
                  <td className="px-4 py-3 text-[#50575e] whitespace-nowrap">
                    {formatTz(new Date(sub.currentPeriodEnd), timezone, "dd/MM/yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <span
                        className={`w-fit px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase border ${
                          STATUS_BADGE[sub.status] || STATUS_BADGE.EXPIRED
                        }`}
                      >
                        {sub.status.replace(/_/g, " ")}
                      </span>
                      <StatusSelect subscriptionId={sub.id} currentStatus={sub.status} />
                    </div>
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
              href={buildHref({ page: p })}
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

