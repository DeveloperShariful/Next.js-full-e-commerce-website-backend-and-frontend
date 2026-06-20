// app/(backend)/admin/wishlist-report/page.tsx

import { getWishlistReport } from "@/app/actions/backend/wishlist/wishlist-report-actions";
import Link from "next/link";
import { Heart, Search, Package, Users, ListChecks } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/30",
  DRAFT: "bg-[#f0f0f1] text-[#50575e] border-[#c3c4c7]",
  ARCHIVED: "bg-[#fcf0f1] text-[#d63638] border-[#d63638]/30",
};

export default async function WishlistReportPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";

  const { rows, totalPages, summary } = await getWishlistReport(page, search);

  const buildHref = (overrides: Record<string, string | number>) => {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === "" || v === 0) sp.delete(k);
      else sp.set(k, String(v));
    });
    const qs = sp.toString();
    return `/admin/wishlist-report${qs ? `?${qs}` : ""}`;
  };

  const rankOffset = (page - 1) * 20;

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[23px] font-normal text-[#1d2327] flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#d63638]" /> Most Wishlisted Products
          </h1>
          <p className="text-[13px] text-[#50575e] mt-0.5">
            Which products customers want most — useful for promotions &amp; restocking.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-[#c3c4c7] p-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-[#fcf0f1] flex items-center justify-center">
            <Heart className="w-4 h-4 text-[#d63638]" />
          </div>
          <div>
            <p className="text-[20px] font-semibold text-[#1d2327] leading-none">
              {summary.totalEntries}
            </p>
            <p className="text-[12px] text-[#50575e] mt-0.5">Total wishlist saves</p>
          </div>
        </div>
        <div className="bg-white border border-[#c3c4c7] p-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-[#f0f6fc] flex items-center justify-center">
            <Package className="w-4 h-4 text-[#2271b1]" />
          </div>
          <div>
            <p className="text-[20px] font-semibold text-[#1d2327] leading-none">
              {summary.uniqueProducts}
            </p>
            <p className="text-[12px] text-[#50575e] mt-0.5">Unique products</p>
          </div>
        </div>
        <div className="bg-white border border-[#c3c4c7] p-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-[#edfaef] flex items-center justify-center">
            <Users className="w-4 h-4 text-[#00a32a]" />
          </div>
          <div>
            <p className="text-[20px] font-semibold text-[#1d2327] leading-none">
              {summary.uniqueUsers}
            </p>
            <p className="text-[12px] text-[#50575e] mt-0.5">Customers wishlisting</p>
          </div>
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
              placeholder="Search by product name or SKU..."
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
              href="/admin/wishlist-report"
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
              <th className="px-4 py-2.5 text-center font-semibold text-[#2c3338] w-12">#</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#2c3338]">Product</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#2c3338]">Wishlisted</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#2c3338]">Price</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#2c3338]">Stock</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#2c3338]">Status</th>
              <th className="px-4 py-2.5 text-center font-semibold text-[#2c3338]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#50575e]">
                  <ListChecks className="w-8 h-8 mx-auto mb-2 text-[#c3c4c7]" />
                  No wishlist data yet.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.productId} className="hover:bg-[#f6f7f7] transition-colors">
                  <td className="px-4 py-3 text-center font-semibold text-[#8c8f94]">
                    {rankOffset + i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {row.featuredImage ? (
                        <img
                          src={row.featuredImage}
                          className="w-10 h-10 rounded-sm object-cover border border-[#c3c4c7] shrink-0"
                          alt=""
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-sm bg-[#f0f0f1] flex items-center justify-center border border-[#c3c4c7] shrink-0">
                          <Package className="w-4 h-4 text-[#c3c4c7]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/create?id=${row.productId}`}
                          className="font-semibold text-[#2271b1] hover:underline block truncate"
                        >
                          {row.name}
                        </Link>
                        <span className="text-[11px] text-[#8c8f94]">#{row.productCode}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#d63638]">
                      <Heart className="w-3.5 h-3.5 fill-[#d63638]" />
                      {row.count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#1d2327] whitespace-nowrap">
                    {row.salePrice !== null ? (
                      <>
                        <span className="text-[#00a32a] font-semibold">
                          A${row.salePrice.toFixed(2)}
                        </span>
                        <span className="text-[#8c8f94] line-through ml-1 text-[11px]">
                          A${row.price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <>A${row.price.toFixed(2)}</>
                    )}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      row.stock <= 0
                        ? "text-[#d63638]"
                        : row.stock < 5
                        ? "text-[#bd8600]"
                        : "text-[#50575e]"
                    }`}
                  >
                    {row.stock <= 0 ? "Out" : row.stock}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase border ${
                        STATUS_BADGE[row.status] || STATUS_BADGE.DRAFT
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/admin/products/create?id=${row.productId}`}
                      className="inline-flex items-center px-3 py-1 bg-[#2271b1] text-white text-[12px] rounded-sm hover:bg-[#135e96] transition-colors font-semibold"
                    >
                      Edit
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
