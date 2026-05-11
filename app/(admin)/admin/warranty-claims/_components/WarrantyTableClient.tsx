//app/(backend)/admin/warranty-claims/_components/WarrantyTableClient.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updateClaimStatus, bulkUpdateClaimStatus, deleteClaimPermanently, bulkDeleteClaimsPermanently } from '../../../action/warranty/claim-action';
import Pagination from './Pagination'; 

export default function WarrantyTableClient({ claims, currentFilter, totalItems, itemsPerPage }: { claims: any[], currentFilter: string, totalItems: number, itemsPerPage: number }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const isTrashView = currentFilter === 'TRASHED';

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(claims.map((c) => c.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter((i) => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleBulkApply = async () => {
    if (selectedIds.length === 0) return alert('Please select at least one claim.');
    if (!bulkAction) return alert('Please select a bulk action.');

    setIsApplying(true);

    if (bulkAction === 'DELETE_PERMANENTLY') {
      if (confirm('Are you sure you want to permanently delete these claims? This cannot be undone.')) {
        await bulkDeleteClaimsPermanently(selectedIds);
      }
    } else {
      await bulkUpdateClaimStatus(selectedIds, bulkAction);
    }

    setSelectedIds([]); setBulkAction(''); setIsApplying(false);
  };

  return (
    <>
      <div className="flex justify-between items-center bg-white p-2 border-y sm:border sm:border-[#c3c4c7] sm:border-b-0 mt-2 -mx-4 sm:mx-0">
        <div className="flex items-center gap-2 px-2 sm:px-0">
          <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="border border-[#8c8f94] rounded text-[13px] px-2 py-1 outline-none focus:border-[#2271b1]">
            <option value="">Bulk actions</option>
            {isTrashView ? (
              <>
                <option value="PENDING">Restore</option>
                <option value="DELETE_PERMANENTLY">Delete Permanently</option>
              </>
            ) : (
              <>
                <option value="APPROVED">Approve</option>
                <option value="REJECTED">Reject</option>
                <option value="TRASHED">Move to Trash</option>
              </>
            )}
          </select>
          <button onClick={handleBulkApply} disabled={isApplying} className="border border-[#2271b1] text-[#2271b1] px-3 py-1 text-[13px] rounded hover:bg-[#f0f0f1] transition-colors disabled:opacity-50">
            {isApplying ? 'Applying...' : 'Apply'}
          </button>
        </div>

        {/* <-- এখানে Total Items ফিরিয়ে আনা হয়েছে এবং পেজিনেশন অ্যাড করা হয়েছে --> */}
        <div className="flex items-center gap-4 pr-2 sm:pr-0">
          <div className="hidden sm:block">
            <Pagination totalItems={totalItems} itemsPerPage={itemsPerPage} />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white border-b sm:border border-[#c3c4c7] shadow-sm min-h-[400px] -mx-4 sm:mx-0">
        <table className="w-full text-left text-[13px] text-[#3c434a]">
          <thead>
            <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7]">
              <th className="p-3 sm:p-2 w-8 text-center pl-4 sm:pl-2">
                <input type="checkbox" className="border-[#8c8f94] cursor-pointer" onChange={handleSelectAll} checked={claims.length > 0 && selectedIds.length === claims.length} />
              </th>
              <th className="p-3 sm:p-2 font-semibold whitespace-nowrap">Customer Name</th>
              <th className="p-3 sm:p-2 font-semibold whitespace-nowrap">Order Number</th>
              {/* <-- Email কলাম ফিরিয়ে আনা হয়েছে --> */}
              <th className="p-3 sm:p-2 font-semibold whitespace-nowrap">Email</th>
              <th className="p-3 sm:p-2 font-semibold whitespace-nowrap">Status</th>
              <th className="p-3 sm:p-2 font-semibold whitespace-nowrap pr-4 sm:pr-2">Date Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {claims.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-[#50575e]">No claims found.</td></tr>
            ) : (
              claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-[#f6f7f7] group">
                  <td className="p-3 sm:p-2 text-center align-top pl-4 sm:pl-2">
                    <input type="checkbox" className="border-[#8c8f94] cursor-pointer" checked={selectedIds.includes(claim.id)} onChange={() => handleSelectOne(claim.id)} />
                  </td>
                  
                  <td className="p-3 sm:p-2 align-top whitespace-nowrap">
                    <Link href={`/admin/warranty-claims/${claim.id}`} className="text-[#2271b1] font-bold text-[14px] hover:underline block mb-1">
                      {claim.name}
                    </Link>
                    
                    <div className="text-[13px] flex items-center gap-2">
                      {isTrashView ? (
                        <>
                          <form action={updateClaimStatus}><input type="hidden" name="id" value={claim.id}/><input type="hidden" name="status" value="PENDING"/><button type="submit" className="text-[#2271b1] hover:underline cursor-pointer">Restore</button></form>
                          <span className="text-gray-300">|</span>
                          <form action={deleteClaimPermanently}><input type="hidden" name="id" value={claim.id}/><button type="submit" className="text-red-500 hover:underline cursor-pointer">Delete Permanently</button></form>
                        </>
                      ) : (
                        <>
                          <Link href={`/admin/warranty-claims/${claim.id}`} className="text-[#2271b1] hover:underline">Edit</Link>
                          <span className="text-gray-300">|</span>
                          <form action={updateClaimStatus}><input type="hidden" name="id" value={claim.id}/><input type="hidden" name="status" value="TRASHED"/><button type="submit" className="text-red-500 hover:underline cursor-pointer">Trash</button></form>
                          <span className="text-gray-300">|</span>
                          <Link href={`/admin/warranty-claims/${claim.id}`} className="text-[#2271b1] hover:underline">View</Link>
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-3 sm:p-2 align-top font-mono text-[#50575e] whitespace-nowrap">#{claim.orderNumber}</td>
                  
                  {/* <-- Email কলামের ডেটা ফিরিয়ে আনা হয়েছে --> */}
                  <td className="p-3 sm:p-2 align-top whitespace-nowrap">
                    <a href={`mailto:${claim.email}`} className="text-[#2271b1] hover:underline">{claim.email}</a>
                  </td>

                  <td className="p-3 sm:p-2 align-top whitespace-nowrap">
                    {claim.status === 'PENDING' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-semibold text-[12px]">Pending</span>}
                    {claim.status === 'APPROVED' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-semibold text-[12px]">Approved</span>}
                    {claim.status === 'REJECTED' && <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded font-semibold text-[12px]">Rejected</span>}
                    {claim.status === 'TRASHED' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-semibold text-[12px]">Trashed</span>}
                  </td>
                  <td className="p-3 sm:p-2 align-top text-[#50575e] whitespace-nowrap pr-4 sm:pr-2">
                    {new Date(claim.createdAt).toLocaleDateString('en-AU')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white border-b sm:border sm:border-t-0 border-[#c3c4c7] p-2 -mx-4 sm:mx-0 sm:hidden">
        <Pagination totalItems={totalItems} itemsPerPage={itemsPerPage} />
      </div>
    </>
  );
}