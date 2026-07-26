'use client';

import { useState } from 'react';
import { Send, BarChart2, ClipboardList, TrendingUp, CalendarCheck, BookOpen } from 'lucide-react';
import ReportForm from './ReportForm';
import ReportsList from './ReportsList';
import AdminFilters from './AdminFilters';
import ExportButton from './ExportButton';
import type { DailyReport, ReportStats } from '@/app/actions/backend/reports/report-actions';

interface Props {
  reports: DailyReport[];
  total: number;
  totalPages: number;
  isAdmin: boolean;
  currentPage: number;
  stats: ReportStats;
  defaultTab?: 'submit' | 'list';
}

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: number; sub?: string;
}) {
  return (
    <div className="bg-white border border-[#dcdcde] rounded-sm p-3 sm:p-4 flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center sm:gap-4">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#f0f6fc] flex items-center justify-center shrink-0 mb-1.5 sm:mb-0">
        {icon}
      </div>
      <div>
        <p className="text-[20px] sm:text-[22px] font-bold text-[#1d2327] leading-none">{value}</p>
        <p className="text-[11px] sm:text-[12px] font-medium text-[#646970] mt-0.5">{label}</p>
        {sub && <p className="hidden sm:block text-[11px] text-[#9ca3af] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function ReportsTabs({
  reports, total, totalPages, isAdmin, currentPage, stats, defaultTab,
}: Props) {
  const [activeTab, setActiveTab] = useState<'submit' | 'list'>(
    defaultTab ?? (isAdmin ? 'list' : 'submit')
  );

  const tabs = [
    { key: 'submit' as const, label: 'Submit Report',    icon: <Send size={13} /> },
    {
      key:   'list' as const,
      label: isAdmin ? 'All Staff Reports' : 'My Reports',
      icon:  <BookOpen size={13} />,
      count: total,
    },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6 px-3 sm:px-0">
        <StatCard
          icon={<TrendingUp size={18} className="text-[#2271b1]" />}
          label="This Week"
          value={stats.thisWeek}
          sub="Reports submitted"
        />
        <StatCard
          icon={<BarChart2 size={18} className="text-[#2271b1]" />}
          label="This Month"
          value={stats.thisMonth}
          sub="Reports submitted"
        />
        <StatCard
          icon={<ClipboardList size={18} className="text-[#2271b1]" />}
          label="Total Reports"
          value={stats.total}
          sub="All time"
        />
      </div>

      {isAdmin && !stats.todaySubmitted && (
        <div className="mb-3 sm:mb-4 mx-3 sm:mx-0 flex items-center gap-2 text-[12px] text-[#646970] bg-[#f6f7f7] border border-[#dcdcde] rounded-sm px-3 py-2">
          <CalendarCheck size={13} />
          No reports submitted today yet.
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#c3c4c7] px-3 sm:px-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-[#2271b1] text-[#2271b1] bg-white'
                : 'border-transparent text-[#646970] hover:text-[#1d2327] hover:bg-[#f6f7f7]'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                activeTab === tab.key ? 'bg-[#2271b1] text-white' : 'bg-[#dcdcde] text-[#646970]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Panel */}
      <div className="bg-[#f6f7f7] border border-t-0 border-[#c3c4c7] p-0 sm:p-5">

        {activeTab === 'submit' && (
          <div className="p-3 sm:p-0">
            <ReportForm todaySubmitted={stats.todaySubmitted} />
          </div>
        )}

        {activeTab === 'list' && (
          <div>
            {/* Filters — admin only */}
            {isAdmin && (
              <div className="px-3 pt-3 sm:px-0 sm:pt-0 sm:mb-0">
                <AdminFilters />
              </div>
            )}

            <div className="bg-white border-t border-b sm:border sm:rounded-sm sm:shadow-sm border-[#c3c4c7]">
              <div className="px-3 sm:px-4 py-3 border-b border-[#c3c4c7] bg-[#f6f7f7] flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-[#1d2327]">
                  {isAdmin ? 'All Staff Reports' : 'My Submitted Reports'}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-[#646970]">{total} total</span>
                  {isAdmin && <ExportButton />}
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <ReportsList
                  reports={reports}
                  total={total}
                  totalPages={totalPages}
                  isOwnerView={isAdmin}
                  currentPage={currentPage}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
