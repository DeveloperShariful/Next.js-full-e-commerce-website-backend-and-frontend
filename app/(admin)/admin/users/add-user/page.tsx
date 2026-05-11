// app/(admin)/admin/users/add-user/page.tsx

import UserFormClient from '../[id]/UserFormClient';
import Link from 'next/link'; 
import { getAllCountries } from '@/app/actions/admin/settings/general/location-helpers'; 

export const dynamic = 'force-dynamic';

export default function AddUserPage() {
  // 🛑 NEW: Fetching dynamic country list for the client form
  const countries = getAllCountries();

  return (
    <div className="w-full px-4 sm:px-6 pb-10 pt-4">
      
      {/* WordPress Style Header with Back Button */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-normal text-[#1d2327]">Add New User</h1>
          <p className="text-[13px] text-[#646970] mt-1">Create a brand new user and add them to this site.</p>
        </div>
        
        {/* Back to Users Button */}
        <Link 
          href="/admin/users" 
          className="inline-flex items-center gap-1 border border-[#2271b1] text-[#2271b1] px-3 py-1.5 text-[13px] font-medium rounded-[3px] hover:bg-[#2271b1] hover:text-white transition-colors bg-white shadow-sm w-fit"
        >
          &larr; Back to Users
        </Link>
      </div>

      {/* 🛑 FIX: Passed the dynamic countries array to the form */}
      <UserFormClient initialData={null} countries={countries} />

    </div>
  );
}