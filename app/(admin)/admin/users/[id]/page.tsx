//app/(admin)/admin/users/[id]/page.tsx

import { db } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link'; 
import UserFormClient from './UserFormClient';
import { getAllCountries } from '@/app/actions/admin/settings/general/location-helpers'; // 🛑 NEW: Import dynamic locations

export const dynamic = 'force-dynamic';

export default async function UserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const isNewUser = id === 'add-user';
  let user = null;

  // 🛑 NEW: Fetching dynamic country list for the client form
  const countries = getAllCountries();

  // যদি আইডি থাকে (Edit মোড), তবে ডাটাবেস থেকে ইউজারের ডেটা এবং অ্যাড্রেস আনবে
  if (!isNewUser) {
    user = await db.user.findUnique({
      where: { id },
      include: { addresses: true } // 🛑 NEW: Fetch billing and shipping addresses
    });

    if (!user) {
      notFound();
    }
  }

  // Client Component এ পাঠানোর জন্য Data Serialize করা হচ্ছে
  const userData = user ? {
    id: user.id,
    name: user.name || '',
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    
    // 🛑 NEW: Extract Billing and Shipping addresses from the array
    billingAddress: user.addresses.find((addr: any) => addr.type === 'BILLING') || null,
    shippingAddress: user.addresses.find((addr: any) => addr.type === 'SHIPPING') || null,
  } : null;

  return (
    <div className="w-full px-4 sm:px-6 pb-10 pt-4">
      
      {/* WordPress Style Header with Back Button */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-normal text-[#1d2327]">
            {isNewUser ? 'Add New User' : 'Edit User'}
          </h1>
          {isNewUser && (
            <p className="text-[13px] text-[#646970] mt-1">Create a brand new user and add them to this site.</p>
          )}
        </div>
        
        {/* Back to Users Button */}
        <Link 
          href="/admin/users" 
          className="inline-flex items-center gap-1 border border-[#2271b1] text-[#2271b1] px-3 py-1.5 text-[13px] font-medium rounded-[3px] hover:bg-[#2271b1] hover:text-white transition-colors bg-white shadow-sm w-fit"
        >
          &larr; Back to Users
        </Link>
      </div>

      {/* Main Form (Passing countries dynamically) */}
      <UserFormClient initialData={userData} countries={countries} />

    </div>
  );
}