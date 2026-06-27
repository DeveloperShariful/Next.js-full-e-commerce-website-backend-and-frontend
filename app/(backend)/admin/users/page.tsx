// app/(backend)/admin/users/page.tsx

import { db } from '@/lib/prisma';
import Link from 'next/link';
import { Role } from '@prisma/client';
import UserFilterLinks from './_components/UserFilterLinks';
import UserTableClient from './_components/UserTableClient';

export const dynamic = 'force-dynamic';

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const resolvedParams = await searchParams;
  
  const currentRole = resolvedParams?.role || 'ALL';
  const searchQuery = resolvedParams?.search || '';
  const currentPage = Number(resolvedParams?.page) || 1;
  const ITEMS_PER_PAGE = 20; 
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // =========================================
  // 1. DYNAMIC ROLE COUNTS
  // =========================================
  const allCount = await db.user.count({ where: { isActive: true } });
  const superAdminCount = await db.user.count({ where: { role: 'SUPER_ADMIN', isActive: true } });
  const adminCount = await db.user.count({ where: { role: 'ADMIN', isActive: true } });
  const managerCount = await db.user.count({ where: { role: 'MANAGER', isActive: true } });
  const editorCount = await db.user.count({ where: { role: 'EDITOR', isActive: true } });
  const supportCount = await db.user.count({ where: { role: 'SUPPORT', isActive: true } });
  
  // ✅ FIXED: Customer count should exclude users who have an Affiliate account
  const customerCount = await db.user.count({ 
    where: { 
      role: 'CUSTOMER', 
      isActive: true,
      affiliateAccount: null // Don't count affiliates as plain customers
    } 
  });
  
  // ✅ FIXED: Affiliate Count (Check if Role is AFFILIATE OR if they have an AffiliateAccount)
  const affiliateCount = await db.user.count({ 
    where: { 
      isActive: true,
      OR: [
        { role: 'AFFILIATE' },
        { affiliateAccount: { isNot: null } }
      ]
    } 
  });
  
  const subscriberCount = await db.user.count({ where: { role: 'SUBSCRIBER', isActive: true } });

  const counts = { 
    all: allCount, 
    superAdmin: superAdminCount,
    admin: adminCount, 
    manager: managerCount,
    editor: editorCount,
    support: supportCount,
    customer: customerCount,
    affiliate: affiliateCount,
    subscriber: subscriberCount 
  };

  // =========================================
  // 2. FILTERING LOGIC
  // =========================================
  let whereCondition: any = { isActive: true }; 

  if (currentRole !== 'ALL') {
    if (currentRole === 'AFFILIATE') {
      // ✅ Show users who have the Affiliate Role OR an Affiliate Account
      whereCondition.OR = [
        { role: 'AFFILIATE' },
        { affiliateAccount: { isNot: null } }
      ];
    } else if (currentRole === 'CUSTOMER') {
      // ✅ Hide affiliates from the Customer tab
      whereCondition.role = 'CUSTOMER';
      whereCondition.affiliateAccount = null;
    } else {
      whereCondition.role = currentRole as Role;
    }
  }

  // Search Logic (Merging with OR if it exists)
  if (searchQuery) {
    if (whereCondition.OR) {
      whereCondition.AND = [
        { OR: whereCondition.OR },
        { OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { email: { contains: searchQuery, mode: 'insensitive' } }
          ]
        }
      ];
      delete whereCondition.OR;
    } else {
      whereCondition.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }
  }

  const totalFilteredUsers = await db.user.count({ where: whereCondition });
  
  // =========================================
  // 3. FETCHING DATA
  // =========================================
  const usersRaw = await db.user.findMany({
    where: whereCondition,
    orderBy: { createdAt: 'desc' }, 
    skip: skip,
    take: ITEMS_PER_PAGE,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
      emailVerified: true,
      affiliateAccount: { select: { id: true } }
    }
  });

  const users = usersRaw.map(user => ({
    ...user,
    role: user.affiliateAccount ? 'AFFILIATE' : user.role,
    createdAt: user.createdAt.toISOString(),
    emailVerified: !!user.emailVerified,
    image: user.image ?? null,
  }));

  return (
    <div className="w-full pb-10 pt-1 overflow-x-hidden font-sans">
      
      <div className="flex items-center gap-3 mb-3 pl-2 sm:pl-0">
        <h1 className="text-[23px] font-normal text-[#1d2327] leading-none m-0">Users</h1>
        <Link 
          href="/admin/users/add-user" 
          className="border border-[#2271b1] text-[#2271b1] px-2.5 py-0.5 text-[13px] rounded-[3px] hover:bg-[#f6f7f7] transition-colors leading-normal"
        >
          Add New
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 pl-2 sm:pl-0 pr-2 sm:pr-0 max-w-full">
        <div className="mt-1 w-full sm:w-auto overflow-hidden">
          <UserFilterLinks counts={counts} currentRole={currentRole} />
        </div>
        
        <form method="GET" action="/admin/users" className="flex items-center gap-1 w-full sm:w-auto mt-2 sm:mt-0">
          {currentRole !== 'ALL' && <input type="hidden" name="role" value={currentRole} />}
          <input 
            type="text" 
            name="search" 
            defaultValue={searchQuery} 
            className="border border-[#8c8f94] rounded-[3px] px-2 py-1 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] outline-none h-[30px] w-full min-w-[100px] sm:min-w-[180px]"
          />
          <button type="submit" className="border border-[#2271b1] text-[#2271b1] bg-[#f0f6fc] hover:bg-[#f0f0f1] px-3 h-[30px] text-[13px] rounded-[3px] transition-colors cursor-pointer font-semibold shrink-0 whitespace-nowrap">
            Search Users
          </button>
        </form>
      </div>
      
      <UserTableClient 
        users={users} 
        currentRole={currentRole} 
        searchQuery={searchQuery}
        totalItems={totalFilteredUsers} 
        itemsPerPage={ITEMS_PER_PAGE} 
        currentPage={currentPage}
      />

    </div>
  );
}