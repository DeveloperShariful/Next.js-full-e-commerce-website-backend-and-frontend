//app/(backend)/admin/users/[id]/page.tsx

import { db } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import UserFormClient from './UserFormClient';
import { getAllCountries } from '@/app/actions/backend/settings/general/location-helpers';
import { BackButton } from '@/app/(backend)/admin/_components/back-button';

export const dynamic = 'force-dynamic';

export default async function UserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const isNewUser = id === 'add-user';
  let user = null;

  const countries = getAllCountries();

  if (!isNewUser) {
    user = await db.user.findUnique({
      where: { id },
      include: { addresses: true }
    });

    if (!user) {
      notFound();
    }
  }

  // Edit mode-এ order activity fetch করো
  let userActivity: { orderCount: number; totalSpent: number; memberSince: string } | null = null;
  if (!isNewUser && user) {
    const orderStats = await db.order.aggregate({
      where: { userId: user.id, NOT: { status: { equals: 'CANCELLED' } } },
      _count: { id: true },
      _sum: { totalPaid: true },
    });
    userActivity = {
      orderCount: orderStats._count.id,
      totalSpent: Number(orderStats._sum.totalPaid ?? 0),
      memberSince: user.createdAt.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
  }

  const userData = user ? {
    id: user.id,
    name: user.name || '',
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    image: user.image || '',
    bio: user.bio || '',
    slug: user.slug || '',
    socialLinks: user.socialLinks,
    metafields: (user.metafields && typeof user.metafields === 'object' && !Array.isArray(user.metafields)
      ? user.metafields
      : {}) as Record<string, string>,
    billingAddress: user.addresses.find((addr) => addr.type === 'BILLING') || null,
    shippingAddress: user.addresses.find((addr) => addr.type === 'SHIPPING') || null,
  } : null;

  return (
    <div className="w-full px-4 sm:px-6 pb-10 pt-4">
      
      {/* Back to Users Button — Products/Orders-এর মতোই বাম পাশে, উপরে; ঠিক আগের scroll position ও filter/search/page state-এ ফিরে যায় */}
      <div className="mb-2">
        <BackButton storageKey="users-return-url" fallbackUrl="/admin/users" label="Back to Users" />
      </div>

      {/* WordPress Style Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-normal text-[#1d2327]">
            {isNewUser ? 'Add New User' : 'Edit User'}
          </h1>
          {isNewUser && (
            <p className="text-[13px] text-[#646970] mt-1">Create a brand new user and add them to this site.</p>
          )}
        </div>
      </div>

      {/* Activity Summary (Edit mode only) */}
      {userActivity && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-[#c3c4c7] rounded-sm p-4 shadow-sm">
            <div className="text-[24px] font-semibold text-[#1d2327] leading-none">{userActivity.orderCount}</div>
            <div className="text-[12px] text-[#646970] mt-1">Orders placed</div>
          </div>
          <div className="bg-white border border-[#c3c4c7] rounded-sm p-4 shadow-sm">
            <div className="text-[24px] font-semibold text-[#1d2327] leading-none">${userActivity.totalSpent.toFixed(2)}</div>
            <div className="text-[12px] text-[#646970] mt-1">Total spent</div>
          </div>
          <div className="bg-white border border-[#c3c4c7] rounded-sm p-4 shadow-sm">
            <div className="text-[14px] font-semibold text-[#1d2327] leading-none pt-1">{userActivity.memberSince}</div>
            <div className="text-[12px] text-[#646970] mt-1">Member since</div>
          </div>
        </div>
      )}

      {/* Main Form (Passing countries dynamically) */}
      <UserFormClient initialData={userData} countries={countries} />

    </div>
  );
}