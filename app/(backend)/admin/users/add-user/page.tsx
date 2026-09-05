// app/(backend)/admin/users/add-user/page.tsx

import UserFormClient from '../[id]/UserFormClient';
import { getAllCountries } from '@/app/actions/backend/settings/general/location-helpers';
import { BackButton } from '@/app/(backend)/admin/_components/back-button';

export const dynamic = 'force-dynamic';

export default function AddUserPage() {
  // 🛑 NEW: Fetching dynamic country list for the client form
  const countries = getAllCountries();

  return (
    <div className="w-full px-4 sm:px-6 pb-10 pt-4">
      
      {/* Back to Users Button — Products/Orders-এর মতোই বাম পাশে, উপরে; ঠিক আগের scroll position ও filter/search/page state-এ ফিরে যায় */}
      <div className="mb-2">
        <BackButton storageKey="users-return-url" fallbackUrl="/admin/users" label="Back to Users" />
      </div>

      {/* WordPress Style Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-normal text-[#1d2327]">Add New User</h1>
          <p className="text-[13px] text-[#646970] mt-1">Create a brand new user and add them to this site.</p>
        </div>
      </div>

      {/* 🛑 FIX: Passed the dynamic countries array to the form */}
      <UserFormClient initialData={null} countries={countries} />

    </div>
  );
}