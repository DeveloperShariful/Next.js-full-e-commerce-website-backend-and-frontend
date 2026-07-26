'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, ChevronUp, Calendar, Clock, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { markReportReviewed } from '@/app/actions/backend/reports/report-actions';
import type { DailyReport } from '@/app/actions/backend/reports/report-actions';

interface Props {
  reports: DailyReport[];
  total: number;
  totalPages: number;
  isOwnerView?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN:       'Admin',
  MANAGER:     'Manager',
  EDITOR:      'Editor',
  SUPPORT:     'Support',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  ADMIN:       'bg-blue-100 text-blue-700 border-blue-200',
  MANAGER:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  EDITOR:      'bg-yellow-100 text-yellow-700 border-yellow-200',
  SUPPORT:     'bg-orange-100 text-orange-700 border-orange-200',
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500',
  'bg-orange-500', 'bg-rose-500', 'bg-cyan-500',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getDateLabel(dateStr: string): string {
  const today     = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today)     return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function Section({ label, content, mono }: { label: string; content: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-[#646970] uppercase tracking-wider mb-1.5">{label}</p>
      <p className={`text-[13px] text-[#1d2327] whitespace-pre-wrap ${mono ? 'font-mono bg-white border border-[#eee] rounded p-2 text-[12px]' : ''}`}>
        {content}
      </p>
    </div>
  );
}

function ReportCard({ report, isOwnerView }: { report: DailyReport; isOwnerView?: boolean }) {
  const [expanded, setExpanded]   = useState(false);
  const [reviewed, setReviewed]   = useState(report.reviewed);
  const [reviewedBy, setReviewedBy] = useState(report.reviewedBy);
  const [isPending, startTransition] = useTransition();

  const roleColor = ROLE_COLORS[report.userRole] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  const avatarBg  = getAvatarColor(report.userName);
  const initials  = getInitials(report.userName);
  const roleLabel = ROLE_LABELS[report.userRole] ?? report.userRole;

  const submittedAt = new Date(report.createdAt).toLocaleTimeString('en-AU', {
    hour: '2-digit', minute: '2-digit',
  });

  const handleMarkReviewed = () => {
    startTransition(async () => {
      const res = await markReportReviewed(report.id);
      if (res.success) {
        setReviewed(true);
        toast.success('Marked as reviewed');
      } else {
        toast.error('Failed to mark as reviewed');
      }
    });
  };

  return (
    <div className={`border rounded-sm bg-white transition-all ${
      expanded ? 'border-[#2271b1] shadow-sm' : reviewed ? 'border-[#c3c4c7]' : 'border-[#dcdcde] hover:border-[#c3c4c7]'
    }`}>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center shrink-0`}>
          <span className="text-white text-[11px] font-bold">{initials}</span>
        </div>

        {/* Info row */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isOwnerView && (
              <span className="text-[13px] font-semibold text-[#1d2327] truncate">{report.userName}</span>
            )}
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${roleColor}`}>
              {roleLabel}
            </span>
            <span className="flex items-center gap-1 text-[12px] text-[#646970]">
              <Calendar size={11} />
              {getDateLabel(report.reportDate)}
            </span>
            <span className="flex items-center gap-1 text-[12px] text-[#9ca3af]">
              <Clock size={11} />
              {submittedAt}
            </span>
            {reviewed && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                <CheckCircle2 size={11} />
                Reviewed{reviewedBy ? ` by ${reviewedBy}` : ''}
              </span>
            )}
          </div>
          {!expanded && (
            <p className="text-[12px] text-[#646970] truncate mt-0.5">{report.summary}</p>
          )}
        </div>

        {expanded
          ? <ChevronUp size={15} className="text-[#2271b1] shrink-0" />
          : <ChevronDown size={15} className="text-[#9ca3af] shrink-0" />
        }
      </button>

      {expanded && (
        <div className="border-t border-[#f0f0f1] px-4 py-4 space-y-4 bg-[#fafafa]">
          <Section label="Summary" content={report.summary} />
          {report.tasks && <Section label="Tasks Completed" content={report.tasks} mono />}
          {report.notes && <Section label="Notes" content={report.notes} />}

          {/* Admin actions */}
          {isOwnerView && !reviewed && (
            <div className="pt-2 border-t border-[#f0f0f1]">
              <button
                type="button"
                onClick={handleMarkReviewed}
                disabled={isPending}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded transition-colors disabled:opacity-60"
              >
                {isPending
                  ? <Loader2 size={12} className="animate-spin" />
                  : <CheckCircle2 size={12} />
                }
                Mark as Reviewed
              </button>
            </div>
          )}
          {isOwnerView && reviewed && (
            <div className="pt-2 border-t border-[#f0f0f1]">
              <span className="flex items-center gap-1.5 text-[12px] text-emerald-600">
                <CheckCircle2 size={12} />
                Reviewed{report.reviewedAt
                  ? ` on ${new Date(report.reviewedAt).toLocaleDateString('en-AU')}`
                  : ''}
                {reviewedBy ? ` by ${reviewedBy}` : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function groupByDate(reports: DailyReport[]): [string, DailyReport[]][] {
  const map = new Map<string, DailyReport[]>();
  for (const r of reports) {
    const key = r.reportDate || new Date(r.createdAt).toISOString().split('T')[0];
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries());
}

export default function ReportsList({
  reports, total, totalPages, isOwnerView, currentPage = 1, onPageChange,
}: Props) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 bg-[#f0f0f1] rounded-full flex items-center justify-center mx-auto mb-3">
          <FileText size={20} className="text-[#646970]" />
        </div>
        <p className="text-[13px] text-[#646970] font-medium">No reports found</p>
        <p className="text-[12px] text-[#9ca3af] mt-0.5">Try adjusting filters or check back later.</p>
      </div>
    );
  }

  const groups = groupByDate(reports);

  return (
    <div>
      <p className="text-[12px] text-[#646970] mb-4">
        Showing {reports.length} of {total} report{total !== 1 ? 's' : ''}
      </p>

      <div className="space-y-5">
        {groups.map(([date, groupReports]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[12px] font-semibold text-[#646970]">{getDateLabel(date)}</span>
              <div className="flex-1 h-px bg-[#f0f0f1]" />
              <span className="text-[11px] text-[#9ca3af] bg-[#f6f7f7] px-1.5 py-0.5 rounded">
                {groupReports.length}
              </span>
            </div>
            <div className="space-y-2">
              {groupReports.map(r => (
                <ReportCard key={r.id} report={r} isOwnerView={isOwnerView} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-[#f0f0f1]">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 border border-[#c3c4c7] rounded-[3px] text-[12px] text-[#646970] disabled:opacity-40 hover:bg-[#f6f7f7] transition"
          >
            ← Prev
          </button>
          <span className="text-[12px] text-[#646970] px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 border border-[#c3c4c7] rounded-[3px] text-[12px] text-[#646970] disabled:opacity-40 hover:bg-[#f6f7f7] transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
