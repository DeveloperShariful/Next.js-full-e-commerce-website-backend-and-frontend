//app/(backend)/admin/users/_components/UserTableClient.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from "sonner";
import { Role } from '@prisma/client';
import { deleteUser, bulkDeleteUsers, bulkChangeRole, sendPasswordReset } from '@/app/actions/backend/users/user-actions';
import Pagination from '@/app/(backend)/admin/warranty-claims/_components/Pagination'; 

export default function UserTableClient({ 
  users, 
  currentRole, 
  searchQuery,
  totalItems, 
  itemsPerPage,
  currentPage 
}: { 
  users: any[], 
  currentRole: string, 
  searchQuery: string,
  totalItems: number, 
  itemsPerPage: number,
  currentPage: number
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkRole, setBulkRole] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(users.map((u) => u.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter((i) => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleBulkApply = async () => {
    if (selectedIds.length === 0) return toast.error('Please select at least one user.');
    if (!bulkAction) return toast.error('Please select an action.');
    setIsApplying(true);
    if (bulkAction === 'DELETE') {
      if (confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) {
        const res = await bulkDeleteUsers(selectedIds);
        if (res.success) toast.success(res.message);
        else toast.error(res.message);
      }
    }
    setSelectedIds([]); setBulkAction(''); setIsApplying(false);
  };

  const handleChangeRole = async () => {
    if (selectedIds.length === 0) return toast.error('Please select at least one user.');
    if (!bulkRole) return toast.error('Please select a role.');
    setIsApplying(true);
    const res = await bulkChangeRole(selectedIds, bulkRole as Role);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
    setSelectedIds([]); setBulkRole(''); setIsApplying(false);
  };

  const handleDeleteSingle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const formData = new FormData();
    formData.append('id', id);
    const res = await deleteUser(formData);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
  };

  const handlePasswordReset = async (email: string) => {
    const formData = new FormData();
    formData.append('email', email);
    const res = await sendPasswordReset(formData);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // 🛑 FIX: Helper function to display role names correctly
  const formatRole = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'ADMIN': return 'Administrator';
      case 'MANAGER': return 'Manager';
      case 'EDITOR': return 'Editor';
      case 'SUPPORT': return 'Support';
      case 'AFFILIATE': return 'Affiliate';
      case 'CUSTOMER': return 'Customer';
      case 'SUBSCRIBER': return 'Subscriber';
      default: return role;
    }
  };

  return (
    <div className="w-full">
      {/* --- WordPress Style Tablenav (Top) --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 gap-3 sm:gap-0 pl-1 sm:pl-0 pr-1 sm:pr-0">
        
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {/* Bulk Actions */}
          <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="border border-[#8c8f94] rounded-[3px] text-[13px] px-2 outline-none focus:border-[#2271b1] h-[30px] flex-1 sm:flex-none sm:min-w-[120px] bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]">
            <option value="">Bulk actions</option>
            <option value="DELETE">Delete</option>
          </select>
          <button onClick={handleBulkApply} disabled={isApplying} className="border border-[#2271b1] text-[#2271b1] px-3 h-[30px] text-[13px] rounded-[3px] hover:bg-[#f6f7f7] transition-colors disabled:opacity-50 font-semibold bg-white shrink-0 mr-1 sm:mr-2">
            Apply
          </button>

          {/* Spacer for Mobile to force next line if needed */}
          <div className="w-full sm:hidden h-[1px]"></div>

          {/* Change Role */}
          <select value={bulkRole} onChange={(e) => setBulkRole(e.target.value)} className="border border-[#8c8f94] rounded-[3px] text-[13px] px-2 outline-none focus:border-[#2271b1] h-[30px] flex-1 sm:flex-none sm:min-w-[140px] bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]">
            <option value="">Change role to…</option>
            {/* 🛑 FIX: Added all roles to Bulk Change Dropdown */}
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Administrator</option>
            <option value="MANAGER">Manager</option>
            <option value="EDITOR">Editor</option>
            <option value="SUPPORT">Support</option>
            <option value="AFFILIATE">Affiliate</option>
            <option value="CUSTOMER">Customer</option>
            <option value="SUBSCRIBER">Subscriber</option>
          </select>
          <button onClick={handleChangeRole} disabled={isApplying} className="border border-[#8c8f94] text-[#3c434a] px-3 h-[30px] text-[13px] rounded-[3px] hover:bg-[#f0f0f1] transition-colors disabled:opacity-50 bg-[#f6f7f7] shrink-0">
            Change
          </button>
        </div>

        {/* Top Pagination Info */}
        <div className="hidden sm:flex items-center gap-4 text-[13px] text-[#3c434a]">
          <span className="font-semibold">{totalItems} items</span>
          <Pagination totalItems={totalItems} itemsPerPage={itemsPerPage} />
        </div>
      </div>

      {/* --- Main WordPress Table --- */}
      <div className="bg-white sm:border-y sm:border-x border-y border-[#c3c4c7] sm:rounded-sm overflow-hidden mb-2">
        
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#3c434a] border-collapse">
            <thead>
              <tr className="border-b border-[#c3c4c7] bg-[#f0f0f1]">
                <th className="p-2 w-8 text-center pl-3">
                  <input type="checkbox" className="rounded-[3px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1] cursor-pointer" onChange={handleSelectAll} checked={users.length > 0 && selectedIds.length === users.length} />
                </th>
                <th className="p-2 font-semibold text-[#1d2327]">Username</th>
                <th className="p-2 font-semibold text-[#1d2327]">Name</th>
                <th className="p-2 font-semibold text-[#1d2327]">Email</th>
                <th className="p-2 font-semibold text-[#1d2327]">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1]">
              {users.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-[#50575e]">No users found.</td></tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#f6f7f7]'} hover:bg-[#f0f0f1] group transition-colors`}>
                    <td className="p-2 text-center align-top pl-3 pt-3">
                      <input type="checkbox" className="rounded-[3px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1] cursor-pointer" checked={selectedIds.includes(user.id)} onChange={() => handleSelectOne(user.id)} />
                    </td>
                    <td className="p-2 align-top pt-3 w-[30%]">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-sm bg-gray-200 shrink-0 overflow-hidden border border-[#c3c4c7] flex items-center justify-center">
                          {user.image ? (
                            <img src={user.image} alt={user.name || ''} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-6 h-6 text-gray-400 mt-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                          )}
                        </div>
                        <div className="w-full">
                          <Link href={`/admin/users/${user.id}`} className="text-[#2271b1] font-bold text-[13px] hover:underline block leading-tight">
                            {user.name || 'Unknown'}
                          </Link>
                          <div className="text-[12px] mt-1 invisible group-hover:visible flex items-center gap-1.5 transition-all w-full">
                            <Link href={`/admin/users/${user.id}`} className="text-[#2271b1] hover:underline">Edit</Link>
                            <span className="text-[#c3c4c7]">|</span>
                            <button onClick={() => handleDeleteSingle(user.id)} className="text-[#b32d2e] hover:underline cursor-pointer">Delete</button>
                            <span className="text-[#c3c4c7]">|</span>
                            <button onClick={() => handlePasswordReset(user.email)} className="text-[#2271b1] hover:underline cursor-pointer">Send password reset</button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 align-top pt-3 text-[#3c434a]">{user.name || '—'}</td>
                    <td className="p-2 align-top pt-3">
                      <a href={`mailto:${user.email}`} className="text-[#2271b1] hover:underline">{user.email}</a>
                      {user.emailVerified ? (
                        <span className="ml-1.5 text-[10px] font-medium text-green-600 whitespace-nowrap">✓ Verified</span>
                      ) : (
                        <span className="ml-1.5 text-[10px] font-medium text-[#b32d2e] whitespace-nowrap">Unverified</span>
                      )}
                    </td>
                    <td className="p-2 align-top pt-3 text-[#3c434a]">
                      {/* 🛑 FIX: Uses the formatRole helper */}
                      {formatRole(user.role)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-[#f0f0f1] border-t border-[#c3c4c7]">
              <tr>
                <th className="p-2 w-8 text-center pl-3">
                  <input type="checkbox" className="rounded-[3px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1] cursor-pointer" onChange={handleSelectAll} checked={users.length > 0 && selectedIds.length === users.length} />
                </th>
                <th className="p-2 font-semibold text-[#1d2327]">Username</th>
                <th className="p-2 font-semibold text-[#1d2327]">Name</th>
                <th className="p-2 font-semibold text-[#1d2327]">Email</th>
                <th className="p-2 font-semibold text-[#1d2327]">Role</th>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile Flat List View */}
        <div className="block sm:hidden">
          {users.map((user, index) => (
            <div key={user.id} className={`flex items-start gap-3 py-3 px-2 ${index % 2 === 0 ? 'bg-white' : 'bg-[#f6f7f7]'} border-b border-[#f0f0f1] last:border-0`}>
              <div className="pt-1 shrink-0">
                 <input type="checkbox" className="rounded-[3px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1] cursor-pointer" checked={selectedIds.includes(user.id)} onChange={() => handleSelectOne(user.id)} />
              </div>
              <div className="flex-1 w-full overflow-hidden">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-sm bg-gray-200 shrink-0 overflow-hidden border border-[#c3c4c7] flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400 mt-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                  </div>
                  <Link href={`/admin/users/${user.id}`} className="text-[#2271b1] font-bold text-[14px] hover:underline truncate block w-full">
                    {user.name || 'Unknown'}
                  </Link>
                </div>
                <div className="text-[13px] text-[#50575e] space-y-0.5 ml-10">
                  <p className="truncate"><a href={`mailto:${user.email}`} className="text-[#2271b1] hover:underline">{user.email}</a></p>
                  {/* 🛑 FIX: Uses the formatRole helper */}
                  <p className="text-[#1d2327]">{formatRole(user.role)}</p>
                </div>
                
                <div className="text-[12px] mt-2 ml-10 flex flex-wrap items-center gap-2">
                  <Link href={`/admin/users/${user.id}`} className="text-[#2271b1] hover:underline">Edit</Link>
                  <span className="text-[#c3c4c7]">|</span>
                  <button onClick={() => handleDeleteSingle(user.id)} className="text-[#b32d2e] hover:underline">Delete</button>
                  <span className="text-[#c3c4c7]">|</span>
                  <button onClick={() => handlePasswordReset(user.email)} className="text-[#2271b1] hover:underline">Send password reset</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Bottom Pagination --- */}
      <div className="flex justify-between items-center py-2 pl-1 sm:pl-0 pr-1 sm:pr-0">
        <div className="hidden sm:flex items-center gap-1.5">
          <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="border border-[#8c8f94] rounded-[3px] text-[13px] px-2 outline-none focus:border-[#2271b1] h-[30px] min-w-[120px] bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]">
            <option value="">Bulk actions</option>
            <option value="DELETE">Delete</option>
          </select>
          <button onClick={handleBulkApply} disabled={isApplying} className="border border-[#2271b1] text-[#2271b1] px-3 h-[30px] text-[13px] rounded-[3px] hover:bg-[#f6f7f7] transition-colors disabled:opacity-50 font-semibold bg-white">
            Apply
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 text-[13px] text-[#3c434a] w-full sm:w-auto">
          <span className="font-semibold sm:hidden ml-2">{totalItems} items</span>
          <div className="mr-2 sm:mr-0">
            <Pagination totalItems={totalItems} itemsPerPage={itemsPerPage} />
          </div>
        </div>
      </div>
    </div>
  );
}