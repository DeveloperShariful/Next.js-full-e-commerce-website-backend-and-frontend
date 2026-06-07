//File Path: app/(backend)/admin/marketing/merchant-center/_components/TabProductFeed.tsx

"use client";

import Link from "next/link";

interface Props {
  syncLogs: any[];
  totalProducts: number;
}

export default function TabProductFeed({ syncLogs, totalProducts }: Props) {
  // Stats calculation based on passed syncLogs
  const activeCount = syncLogs.filter(log => log.status === "SYNCED" && !log.googleIssues).length;
  const disapprovedCount = syncLogs.filter(log => log.status === "FAILED").length;
  const warningCount = syncLogs.filter(log => log.status === "SYNCED" && log.googleIssues).length;
  const notSyncedCount = totalProducts - syncLogs.length;

  return (
    <div className="max-w-[1200px] mx-auto mt-2">
      
      {/* Overview Box */}
      <div className="bg-white border border-[#ccd0d4] rounded-[3px] mb-8">
        <h2 className="text-[14px] font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-4 py-3 m-0 flex items-center gap-1">
          Overview
        </h2>
        
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#ccd0d4]">
          <div className="flex-1 p-6">
            <p className="text-[13px] text-[#1d2327] m-0 mb-4 font-medium">Active</p>
            <p className="text-[28px] text-[#1d2327] font-normal m-0">{activeCount}</p>
          </div>
          <div className="flex-1 p-6">
            <p className="text-[13px] text-[#1d2327] m-0 mb-4 font-medium">Expiring</p>
            <p className="text-[28px] text-[#1d2327] font-normal m-0">0</p>
          </div>
          <div className="flex-1 p-6">
            <p className="text-[13px] text-[#1d2327] m-0 mb-4 font-medium">Pending / Warnings</p>
            <p className="text-[28px] text-[#1d2327] font-normal m-0">{warningCount}</p>
          </div>
          <div className="flex-1 p-6">
            <p className="text-[13px] text-[#1d2327] m-0 mb-4 font-medium">Disapproved</p>
            <p className="text-[28px] text-[#d63638] font-normal m-0">{disapprovedCount}</p>
          </div>
          <div className="flex-1 p-6">
            <p className="text-[13px] text-[#1d2327] m-0 mb-4 font-medium">Not Synced</p>
            <p className="text-[28px] text-[#1d2327] font-normal m-0">{notSyncedCount > 0 ? notSyncedCount : 0}</p>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      {disapprovedCount > 0 && (
        <div className="bg-white border border-[#ccd0d4] rounded-[3px] mb-8">
          <div className="flex items-center border-b border-[#ccd0d4]">
            <h2 className="text-[16px] font-normal text-[#1d2327] px-6 py-4 m-0">Issues to resolve</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f9f9f9] border-b border-[#ccd0d4]">
                <tr>
                  <th className="py-3 px-6 font-semibold text-[#1d2327] w-[50px]">Type</th>
                  <th className="py-3 px-6 font-semibold text-[#1d2327]">Affected product</th>
                  <th className="py-3 px-6 font-semibold text-[#1d2327]">Issue</th>
                  <th className="py-3 px-6 font-semibold text-[#1d2327]">Suggested action</th>
                </tr>
              </thead>
              <tbody>
                {syncLogs.filter(log => log.status === "FAILED").map((log) => (
                  <tr key={log.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7]">
                    <td className="py-3 px-6 text-center">
                      <span className="text-[#d63638] font-bold border border-[#d63638] rounded-full w-5 h-5 inline-flex items-center justify-center">!</span>
                    </td>
                    <td className="py-3 px-6">
                      <Link href={`/admin/products/${log.product.id}/edit`} className="text-[#2271b1] hover:underline font-semibold">
                        {log.product.name}
                      </Link>
                    </td>
                    <td className="py-3 px-6 text-[#1d2327] max-w-[300px] truncate" title={log.errorMessage || "Unknown error"}>
                      {log.errorMessage}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-4">
                        <Link href="/admin/marketing/merchant-center?tab=attributes" className="text-[#2271b1] hover:underline">Fix mapping</Link>
                        <Link href={`/admin/products/${log.product.id}/edit`} className="text-[#2271b1] hover:underline">Edit product</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Feed Table */}
      <div className="bg-white border border-[#ccd0d4] rounded-[3px]">
        <div className="flex items-center justify-between border-b border-[#ccd0d4] px-4 py-3">
          <h2 className="text-[16px] font-normal text-[#1d2327] m-0">Product Feed</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f9f9f9] border-b border-[#ccd0d4]">
              <tr>
                <th className="py-3 px-4 w-[40px]"><input type="checkbox" /></th>
                <th className="py-3 px-4 font-semibold text-[#1d2327]">Product Title</th>
                <th className="py-3 px-4 font-semibold text-[#1d2327]">Channel Visibility</th>
                <th className="py-3 px-4 font-semibold text-[#1d2327]">Status</th>
                <th className="py-3 px-4 w-[80px]"></th>
              </tr>
            </thead>
            <tbody>
              {syncLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#646970]">
                    No products synced yet.
                  </td>
                </tr>
              ) : (
                syncLogs.map(log => (
                  <tr key={log.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7]">
                    <td className="py-3 px-4"><input type="checkbox" /></td>
                    <td className="py-3 px-4 text-[#1d2327] font-medium">{log.product.name}</td>
                    <td className="py-3 px-4 text-[#646970]">Sync and show</td>
                    <td className="py-3 px-4">
                      {log.status === "SYNCED" && !log.googleIssues && <span className="text-[#00a32a] font-semibold">Approved</span>}
                      {log.status === "SYNCED" && log.googleIssues && <span className="text-[#dba617] font-semibold">Approved (Warnings)</span>}
                      {log.status === "FAILED" && <span className="text-[#d63638] font-semibold">Disapproved</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/products/${log.product.id}/edit`} className="text-[#2271b1] hover:underline">Edit</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}