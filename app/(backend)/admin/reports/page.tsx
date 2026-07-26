import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/prisma';
import { ClipboardList } from 'lucide-react';
import ReportsTabs from './_components/ReportsTabs';
import { getDailyReports, getReportStats } from '@/app/actions/backend/reports/report-actions';
import type { ReportFilters } from '@/app/actions/backend/reports/report-actions';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export default async function DailyReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; staff?: string; from?: string; to?: string; reviewed?: string; tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect('/sign-in');

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, role: true },
  });
  if (!user) redirect('/sign-in');

  const { page: pageStr, staff, from, to, reviewed, tab } = await searchParams;
  const page    = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
  const isAdmin = ADMIN_ROLES.includes(user.role);

  const filters: ReportFilters = isAdmin ? {
    staffName:      staff       || undefined,
    fromDate:       from        || undefined,
    toDate:         to          || undefined,
    reviewedFilter: (reviewed as ReportFilters['reviewedFilter']) || 'all',
  } : {};

  const [{ reports, total, totalPages }, stats] = await Promise.all([
    getDailyReports(page, isAdmin ? undefined : user.id, filters),
    getReportStats(user.id),
  ]);

  const defaultTab = (tab === 'submit' || tab === 'list')
    ? tab
    : isAdmin ? 'list' : 'submit';

  return (
    <div className="max-w-4xl mx-auto px-0 sm:px-4 py-4 sm:py-6">
      <div className="flex items-center gap-3 mb-4 sm:mb-6 px-3 sm:px-0">
        <div className="w-9 h-9 bg-[#2271b1] rounded-sm flex items-center justify-center shrink-0">
          <ClipboardList size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-[#1d2327]">Daily Reports</h1>
          <p className="text-[13px] text-[#646970]">
            {isAdmin
              ? 'Monitor and review all staff daily work reports.'
              : 'Submit your daily work report to the admin.'}
          </p>
        </div>
      </div>

      <ReportsTabs
        reports={reports}
        total={total}
        totalPages={totalPages}
        isAdmin={isAdmin}
        currentPage={page}
        stats={stats}
        defaultTab={defaultTab}
      />
    </div>
  );
}
