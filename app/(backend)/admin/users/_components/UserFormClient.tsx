//app/(backend)/admin/users/[id]/UserFormClient.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Role } from '@prisma/client';

import { createUser, updateUser } from '@/app/actions/backend/users/user-actions';

export default function UserFormClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);

  // WordPress Style Password Generator State
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Password জেনারেটর ফাংশন
  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
    setShowPasswordInput(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (isEditing) {
      formData.append('id', initialData.id);
    }

    // যদি ইউজার পাসওয়ার্ড চেঞ্জ না করে, তবে ফাঁকা পাঠাবে
    if (!showPasswordInput) {
        formData.set('password', '');
    }

    try {
      const res = isEditing ? await updateUser(formData) : await createUser(formData);
      
      if (res.success) {
        toast.success(res.message);
        if (!isEditing) {
          router.push('/admin/users'); // নতুন ইউজার হলে লিস্ট পেজে ব্যাক করবে
        } else {
          router.refresh(); // এডিট হলে একই পেজে থাকবে
        }
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  // WooCommerce Standard Classes
  const headingClass = "text-[18px] font-semibold text-[#1d2327] mb-2 pt-6 border-t border-[#c3c4c7] first:border-0 first:pt-0";
  const descClass = "block text-[#646970] text-[13px] font-normal mt-1";
  
  const tableClass = "w-full text-left text-[14px] text-[#3c434a] mb-8 block sm:table";
  const thClass = "py-[15px] sm:py-[20px] pr-[20px] font-semibold w-full sm:w-[250px] align-top text-left text-[#1d2327] text-[14px] block sm:table-cell";
  const tdClass = "py-[10px] sm:py-[15px] px-[10px] align-top text-[#3c434a] block sm:table-cell";
  
  const inputClass = "w-full max-w-[400px] border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] outline-none transition-shadow bg-white";
  const selectClass = "w-full max-w-[400px] border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] outline-none transition-shadow bg-white";
  const btnClass = "bg-[#2271b1] border border-[#2271b1] text-white px-4 py-[5px] text-[13px] font-semibold rounded-[3px] shadow-[0_1px_0_#2271b1] hover:bg-[#135e96] focus:outline-none transition-colors cursor-pointer disabled:opacity-50 w-full sm:w-auto";
  const secondaryBtnClass = "bg-[#f6f7f7] border border-[#2271b1] text-[#2271b1] px-3 py-1 text-[13px] font-semibold rounded-[3px] hover:bg-[#f0f0f1] transition-colors cursor-pointer";

  return (
    <form onSubmit={handleSave} className="pb-10 max-w-full overflow-hidden">
      
      {/* 1. Name & Contact Info */}
      <h2 className={headingClass}>Name</h2>
      <table className={tableClass}>
        <tbody className="block sm:table-row-group">
          
          <tr className="border-b border-[#c3c4c7] sm:border-[#f0f0f1] block sm:table-row">
            <th className={thClass}>Username / Email <span className="text-[#d63638]">*</span></th>
            <td className={tdClass}>
              <input 
                name="email" 
                type="email" 
                required 
                defaultValue={initialData?.email || ''} 
                className={inputClass} 
              />
              <span className={descClass}>Email address is used as the username for login.</span>
            </td>
          </tr>
          
          <tr className="border-b border-[#c3c4c7] sm:border-transparent block sm:table-row">
            <th className={thClass}>Full Name</th>
            <td className={tdClass}>
              <input 
                name="name" 
                defaultValue={initialData?.name || ''} 
                className={inputClass} 
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* 2. Account Management */}
      <h2 className={headingClass}>Account Management</h2>
      <table className={tableClass}>
        <tbody className="block sm:table-row-group">
          
          <tr className="border-b border-[#c3c4c7] sm:border-[#f0f0f1] block sm:table-row">
            <th className={thClass}>Role</th>
            <td className={tdClass}>
              <select 
                name="role" 
                defaultValue={initialData?.role || 'CUSTOMER'} 
                className={selectClass}
              >
                {/* 🛑 FIX: Added all remaining roles here */}
                <option value="SUBSCRIBER">Subscriber</option>
                <option value="CUSTOMER">Customer</option>
                <option value="AFFILIATE">Affiliate</option>
                <option value="SUPPORT">Support</option>
                <option value="EDITOR">Editor</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Administrator</option>
                <option value="SUPER_ADMIN">Super Administrator</option>
              </select>
            </td>
          </tr>

          <tr className="border-b border-[#c3c4c7] sm:border-transparent block sm:table-row">
            <th className={thClass}>Password</th>
            <td className={tdClass}>
              {!showPasswordInput ? (
                <button type="button" onClick={generatePassword} className={secondaryBtnClass}>
                  {isEditing ? 'Set New Password' : 'Generate password'}
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input 
                      name="password" 
                      type="text" 
                      defaultValue={generatedPassword} 
                      className={`${inputClass} !w-full sm:!w-[280px] font-mono`} 
                    />
                    <button type="button" onClick={() => setShowPasswordInput(false)} className={secondaryBtnClass}>
                      Cancel
                    </button>
                  </div>
                  <span className={descClass}>
                    {isEditing ? "If you don't want to change the password, just click Cancel." : "You can edit this password or copy it to send to the user."}
                  </span>
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-8 pt-6 border-t border-[#c3c4c7]">
        <button type="submit" disabled={loading} className={btnClass}>
          {loading ? 'Saving...' : isEditing ? 'Update User' : 'Add New User'}
        </button>
      </div>

    </form>
  );
}