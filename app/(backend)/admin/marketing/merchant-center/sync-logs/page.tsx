//File Path: app/(backend)/admin/marketing/merchant-center/sync-logs/page.tsx

import { db } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "GMC Sync Logs | WooCommerce Style",
};

export default async function SyncLogsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  // Pagination Setup (WordPress Style)
  const page = parseInt(searchParams.page || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  // ডাটাবেস থেকে GOOGLE চ্যানেলের স্ট্যাটাসগুলো আনা
  const [logs, total] = await Promise.all([
    db.productChannelStatus.findMany({
      where: { channel: "GOOGLE" },
      include: {
        product: {
          select: { name: true, featuredImage: true, sku: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    db.productChannelStatus.count({ where: { channel: "GOOGLE" } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-[#f0f0f1] text-[#3c434a] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica_Neue',sans-serif] p-4 sm:p-6">
      
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-[23px] font-normal text-[#1d2327]">Product Sync Logs</h1>
        <Link 
          href="/admin/marketing/merchant-center" 
          className="border border-[#2271b1] text-[#2271b1] hover:bg-[#f6f7f7] px-2 py-[3px] rounded-[3px] text-[13px] font-semibold transition-colors"
        >
          &larr; Back to Settings
        </Link>
      </div>

      <div className="text-[13px] mb-2 flex justify-between items-end">
        <p className="m-0 text-[#646970]">
          Total synced/attempted products: <strong>{total}</strong>
        </p>
      </div>

      {/* WordPress Style Data Table */}
      <div className="bg-white border border-[#ccd0d4] shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr>
              <th className="font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-4 py-2 text-[14px]">Image</th>
              <th className="font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-4 py-2 text-[14px]">Product Name</th>
              <th className="font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-4 py-2 text-[14px]">Status</th>
              <th className="font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-4 py-2 text-[14px]">Error Message</th>
              <th className="font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-4 py-2 text-[14px]">Last Synced</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-[#50575e] text-[13px]">
                  No sync logs found. Connect Google account and add products to start syncing.
                </td>
              </tr>
            ) : (
              logs.map((log, index) => (
                <tr key={log.id} className={index % 2 === 0 ? "bg-[#f9f9f9]" : "bg-white"}>
                  {/* Image Column */}
                  <td className="px-4 py-3 border-b border-[#f0f0f1]">
                    {log.product.featuredImage ? (
                      <div className="w-[40px] h-[40px] relative border border-[#ccd0d4] bg-white">
                        <Image 
                          src={log.product.featuredImage} 
                          alt="Product" 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="w-[40px] h-[40px] bg-[#f0f0f1] border border-[#ccd0d4] flex items-center justify-center text-[10px] text-[#8c8f94]">
                        No Img
                      </div>
                    )}
                  </td>

                  {/* Name & SKU */}
                  <td className="px-4 py-3 border-b border-[#f0f0f1]">
                    <p className="m-0 font-semibold text-[#2271b1] text-[13px] hover:underline cursor-pointer">
                      {log.product.name}
                    </p>
                    <p className="m-0 text-[#646970] text-[12px]">SKU: {log.product.sku || "N/A"}</p>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3 border-b border-[#f0f0f1]">
                    {log.status === "SYNCED" && (
                      <span className="inline-flex items-center gap-1 bg-[#edfaef] text-[#00a32a] border border-[#c6e1c6] px-2 py-0.5 rounded-[3px] text-[12px] font-semibold">
                        <span className="w-1.5 h-1.5 bg-[#00a32a] rounded-full"></span> Synced
                      </span>
                    )}
                    {log.status === "FAILED" && (
                      <span className="inline-flex items-center gap-1 bg-[#fcf0f1] text-[#d63638] border border-[#f2c1c1] px-2 py-0.5 rounded-[3px] text-[12px] font-semibold">
                        <span className="w-1.5 h-1.5 bg-[#d63638] rounded-full"></span> Failed
                      </span>
                    )}
                    {log.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 bg-[#fdf3df] text-[#dba617] border border-[#f1d07c] px-2 py-0.5 rounded-[3px] text-[12px] font-semibold">
                        <span className="w-1.5 h-1.5 bg-[#dba617] rounded-full"></span> Pending
                      </span>
                    )}
                  </td>

                  {/* Error Message (If any) */}
                  <td className="px-4 py-3 border-b border-[#f0f0f1] max-w-[250px] truncate text-[13px] text-[#d63638]">
                    {log.errorMessage ? log.errorMessage : <span className="text-[#8c8f94]">-</span>}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 border-b border-[#f0f0f1] text-[13px] text-[#50575e]">
                    {log.lastSyncedAt ? new Date(log.lastSyncedAt).toLocaleString() : "Never"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* WordPress Style Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex gap-1 justify-end">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Link
              key={i}
              href={`/admin/marketing/merchant-center/sync-logs?page=${i + 1}`}
              className={`px-3 py-1 text-[13px] border rounded-[3px] ${
                page === i + 1 
                ? "bg-[#2271b1] text-white border-[#2271b1]" 
                : "bg-white text-[#2271b1] border-[#ccd0d4] hover:bg-[#f6f7f7]"
              }`}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}