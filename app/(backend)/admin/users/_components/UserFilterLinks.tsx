//app/(backend)/admin/users/_components/UserFilterLinks.tsx

'use client';

import Link from 'next/link';

interface Counts {
  all: number;
  superAdmin: number;
  admin: number;
  manager: number;
  editor: number;
  support: number;
  customer: number;
  affiliate: number;
  subscriber: number; 
}

export default function UserFilterLinks({ counts, currentRole }: { counts: Counts, currentRole: string }) {
  
  const linkClass = "hover:underline hover:text-[#2271b1] transition-colors";
  const activeClass = "text-[#1d2327] font-semibold";
  const normalClass = "text-[#2271b1]";
  const countClass = "text-[#50575e] font-normal";
  const separator = <span className="text-[#c3c4c7] mx-1 shrink-0">|</span>;

  return (
    <div className="w-full max-w-[100vw] overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
      <div className="flex items-center gap-1 text-[13px] whitespace-nowrap w-max pr-4">
        
        <Link href="/admin/users" className={`${linkClass} ${currentRole === 'ALL' ? activeClass : normalClass}`}>
          All <span className={countClass}>({counts.all})</span>
        </Link> 
        
        {counts.superAdmin > 0 && (
          <>
            {separator}
            <Link href="/admin/users?role=SUPER_ADMIN" className={`${linkClass} ${currentRole === 'SUPER_ADMIN' ? activeClass : normalClass}`}>
              Super Admin <span className={countClass}>({counts.superAdmin})</span>
            </Link>
          </>
        )}

        {counts.admin > 0 && (
          <>
            {separator}
            <Link href="/admin/users?role=ADMIN" className={`${linkClass} ${currentRole === 'ADMIN' ? activeClass : normalClass}`}>
              Administrator <span className={countClass}>({counts.admin})</span>
            </Link>
          </>
        )}

        {counts.manager > 0 && (
          <>
            {separator}
            <Link href="/admin/users?role=MANAGER" className={`${linkClass} ${currentRole === 'MANAGER' ? activeClass : normalClass}`}>
              Manager <span className={countClass}>({counts.manager})</span>
            </Link>
          </>
        )}

        {counts.editor > 0 && (
          <>
            {separator}
            <Link href="/admin/users?role=EDITOR" className={`${linkClass} ${currentRole === 'EDITOR' ? activeClass : normalClass}`}>
              Editor <span className={countClass}>({counts.editor})</span>
            </Link>
          </>
        )}

        {counts.support > 0 && (
          <>
            {separator}
            <Link href="/admin/users?role=SUPPORT" className={`${linkClass} ${currentRole === 'SUPPORT' ? activeClass : normalClass}`}>
              Support <span className={countClass}>({counts.support})</span>
            </Link>
          </>
        )}

        {counts.customer > 0 && (
          <>
            {separator}
            <Link href="/admin/users?role=CUSTOMER" className={`${linkClass} ${currentRole === 'CUSTOMER' ? activeClass : normalClass}`}>
              Customer <span className={countClass}>({counts.customer})</span>
            </Link>
          </>
        )}

        {counts.affiliate > 0 && (
          <>
            {separator}
            <Link href="/admin/users?role=AFFILIATE" className={`${linkClass} ${currentRole === 'AFFILIATE' ? activeClass : normalClass}`}>
              Affiliate <span className={countClass}>({counts.affiliate})</span>
            </Link>
          </>
        )}

        {counts.subscriber > 0 && (
          <>
            {separator}
            <Link href="/admin/users?role=SUBSCRIBER" className={`${linkClass} ${currentRole === 'SUBSCRIBER' ? activeClass : normalClass}`}>
              Subscriber <span className={countClass}>({counts.subscriber})</span>
            </Link>
          </>
        )}
        
      </div>
    </div>
  );
}