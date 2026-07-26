'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, CalendarDays, FileText, ClipboardList, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { submitDailyReport } from '@/app/actions/backend/reports/report-actions';

interface Props {
  todaySubmitted?: boolean;
}

export default function ReportForm({ todaySubmitted }: Props) {
  const [isLoading, setIsLoading]     = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const [summary, setSummary]         = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, force = false) => {
    e?.preventDefault?.();
    setIsLoading(true);
    setIsDuplicate(false);

    const formData = force && pendingData ? pendingData : new FormData(e.currentTarget ?? undefined as never);
    if (force) formData.set('forceSubmit', 'true');

    const res = await submitDailyReport(formData);

    if (res.isDuplicate) {
      setPendingData(formData);
      setIsDuplicate(true);
      setIsLoading(false);
      return;
    }

    if (res.success) {
      toast.success(res.message);
      setSubmitted(true);
      setSummary('');
      setPendingData(null);
      setTimeout(() => setSubmitted(false), 5000);
    } else {
      toast.error(res.message);
    }
    setIsLoading(false);
  };

  const handleForceSubmit = async () => {
    if (!pendingData) return;
    setIsLoading(true);
    setIsDuplicate(false);
    const formData = new FormData();
    pendingData.forEach((v, k) => formData.set(k, v as string));
    formData.set('forceSubmit', 'true');
    const res = await submitDailyReport(formData);
    if (res.success) {
      toast.success(res.message);
      setSubmitted(true);
      setSummary('');
      setPendingData(null);
      setTimeout(() => setSubmitted(false), 5000);
    } else {
      toast.error(res.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white border border-[#c3c4c7] rounded-sm shadow-sm overflow-hidden mb-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#2271b1] to-[#135e96] px-5 py-4">
        <h2 className="text-white text-[15px] font-semibold flex items-center gap-2">
          <Send size={15} />
          Submit Daily Report
        </h2>
        <p className="text-blue-100 text-[12px] mt-0.5">
          Admin will be notified by email after submission.
        </p>
      </div>

      <div className="p-5 space-y-5">

        {/* Already submitted today banner */}
        {todaySubmitted && !submitted && (
          <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded text-amber-700 text-[13px]">
            <AlertTriangle size={15} className="shrink-0" />
            <span>You already submitted a report for today. You can still submit another if needed.</span>
          </div>
        )}

        {/* Success banner */}
        {submitted && (
          <div className="flex items-center gap-2.5 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-[13px]">
            <CheckCircle2 size={15} className="shrink-0" />
            Report submitted! Admin has been notified via email.
          </div>
        )}

        {/* Duplicate warning */}
        {isDuplicate && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded space-y-3">
            <div className="flex items-start gap-2.5 text-amber-800 text-[13px]">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>You already submitted a report for this date. Do you want to submit another one anyway?</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleForceSubmit}
                disabled={isLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-semibold px-3 py-1.5 rounded flex items-center gap-1.5 disabled:opacity-60"
              >
                {isLoading && <Loader2 size={12} className="animate-spin" />}
                Yes, Submit Anyway
              </button>
              <button
                type="button"
                onClick={() => setIsDuplicate(false)}
                className="border border-amber-300 text-amber-700 hover:bg-amber-100 text-[12px] font-medium px-3 py-1.5 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Report Date */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1d2327] mb-1.5">
              <CalendarDays size={13} className="text-[#2271b1]" />
              Report Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="reportDate"
              defaultValue={today}
              max={today}
              required
              className="border border-[#8c8f94] rounded-[3px] text-[13px] px-3 py-[6px] w-full max-w-[180px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1d2327] mb-1">
              <FileText size={13} className="text-[#2271b1]" />
              Summary <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-[#646970] mb-1.5">What did you accomplish today overall?</p>
            <textarea
              name="summary"
              required
              rows={3}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Today I completed..."
              className="border border-[#8c8f94] rounded-[3px] text-[13px] px-3 py-2 w-full focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none resize-y transition"
            />
            <p className="text-[11px] text-[#646970] mt-0.5 text-right">{summary.length} chars</p>
          </div>

          {/* Tasks */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1d2327] mb-1">
              <ClipboardList size={13} className="text-[#2271b1]" />
              Tasks Completed
            </label>
            <p className="text-[11px] text-[#646970] mb-1.5">List specific tasks, one per line.</p>
            <textarea
              name="tasks"
              rows={4}
              placeholder={"- Updated product descriptions\n- Responded to 5 support tickets\n- Reviewed 3 orders"}
              className="border border-[#8c8f94] rounded-[3px] text-[13px] px-3 py-2 w-full focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none resize-y font-mono transition"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1d2327] mb-1">
              <MessageSquare size={13} className="text-[#2271b1]" />
              Additional Notes
              <span className="text-[11px] font-normal text-[#646970] ml-1">(optional)</span>
            </label>
            <p className="text-[11px] text-[#646970] mb-1.5">Blockers, questions, or anything the admin should know.</p>
            <textarea
              name="notes"
              rows={2}
              placeholder="Optional: issues, blockers, or anything else..."
              className="border border-[#8c8f94] rounded-[3px] text-[13px] px-3 py-2 w-full focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none resize-y transition"
            />
          </div>

          <div className="pt-1 border-t border-[#f0f0f1]">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#2271b1] hover:bg-[#135e96] text-white border border-[#2271b1] hover:border-[#135e96] rounded-[3px] px-5 py-2 text-[13px] font-semibold shadow-sm disabled:opacity-60 flex items-center gap-2 transition-colors"
            >
              {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
              {isLoading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
