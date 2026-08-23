'use server';

import { db } from '@/lib/prisma';
import { auth } from '@/auth';
import { sendNotification } from '@/app/api/email/send-notification';
import { revalidatePath } from 'next/cache';
import { stripHtml } from '@/lib/sanitize';
import { Prisma } from '@prisma/client';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { storeDayStart, formatTz } from '@/lib/store-time';
import { getStoreTimezone } from '@/lib/get-store-timezone';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

function csvCell(val: string | undefined | null): string {
  if (!val) return '';
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export interface DailyReport {
  id: string;
  userName: string;
  userRole: string;
  reportDate: string;
  summary: string;
  tasks: string;
  notes: string;
  images: string[];
  createdAt: Date;
  reviewed: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface ReportStats {
  thisWeek: number;
  thisMonth: number;
  total: number;
  todaySubmitted: boolean;
}

export interface ReportFilters {
  staffName?: string;
  fromDate?: string;
  toDate?: string;
  reviewedFilter?: 'all' | 'reviewed' | 'pending';
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export async function getReportStats(userId?: string): Promise<ReportStats> {
  // Store-এর local timezone অনুযায়ী হিসাব — server-এর নিজের (সাধারণত UTC) ঘড়ি
  // ধরে .setHours() করলে Sydney-তে সকাল ১০টার আগে "এই সপ্তাহ"/"এই মাস"/"আজ"
  // ভুল bucket-এ পড়ে যেত।
  const timezone = await getStoreTimezone();
  const nowZoned = toZonedTime(new Date(), timezone);

  const dayOfWeek = nowZoned.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayZoned = new Date(nowZoned);
  mondayZoned.setDate(nowZoned.getDate() + diffToMonday);
  mondayZoned.setHours(0, 0, 0, 0);
  const startOfWeek = fromZonedTime(mondayZoned, timezone);

  const monthStartZoned = new Date(nowZoned);
  monthStartZoned.setDate(1);
  monthStartZoned.setHours(0, 0, 0, 0);
  const startOfMonth = fromZonedTime(monthStartZoned, timezone);

  const [thisWeek, thisMonth, total] = await Promise.all([
    db.systemLog.count({ where: { source: 'DAILY_REPORT', createdAt: { gte: startOfWeek } } }),
    db.systemLog.count({ where: { source: 'DAILY_REPORT', createdAt: { gte: startOfMonth } } }),
    db.systemLog.count({ where: { source: 'DAILY_REPORT' } }),
  ]);

  let todaySubmitted = false;
  if (userId) {
    const today = formatTz(new Date(), timezone, 'yyyy-MM-dd');
    const todayStart = storeDayStart(new Date(), timezone);
    const recentLogs = await db.systemLog.findMany({
      where: { source: 'DAILY_REPORT', createdAt: { gte: todayStart } },
      select: { context: true },
    });
    todaySubmitted = recentLogs.some(l => {
      const ctx = (l.context ?? {}) as Record<string, string>;
      return ctx.userId === userId && ctx.reportDate === today;
    });
  }

  return { thisWeek, thisMonth, total, todaySubmitted };
}

// ─── Submit ───────────────────────────────────────────────────────────────────
export async function submitDailyReport(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { success: false, isDuplicate: false, message: 'Not authenticated.' };

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, role: true },
  });
  if (!user) return { success: false, isDuplicate: false, message: 'User not found.' };

  const summary    = stripHtml((formData.get('summary')    as string) ?? '').trim();
  const tasks      = stripHtml((formData.get('tasks')      as string) ?? '').trim();
  const notes      = stripHtml((formData.get('notes')      as string) ?? '').trim();
  const reportDate = ((formData.get('reportDate') as string) ?? '').trim()
    || formatTz(new Date(), await getStoreTimezone(), 'yyyy-MM-dd');
  const forceSubmit = formData.get('forceSubmit') === 'true';

  let images: string[] = [];
  try {
    const raw = (formData.get('imageUrls') as string) ?? '[]';
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) images = parsed.filter((u): u is string => typeof u === 'string');
  } catch { images = []; }

  if (!summary) return { success: false, isDuplicate: false, message: 'Summary is required.' };

  if (!forceSubmit) {
    const window7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentLogs = await db.systemLog.findMany({
      where: { source: 'DAILY_REPORT', createdAt: { gte: window7d } },
      select: { context: true },
    });
    const isDuplicate = recentLogs.some(l => {
      const ctx = (l.context ?? {}) as Record<string, string>;
      return ctx.userId === user.id && ctx.reportDate === reportDate;
    });
    if (isDuplicate) {
      return { success: false, isDuplicate: true, message: `You already submitted a report for ${reportDate}. Submit again?` };
    }
  }

  await db.systemLog.create({
    data: {
      level: 'INFO',
      source: 'DAILY_REPORT',
      message: summary,
      context: {
        userId:     user.id,
        userName:   user.name || 'Staff',
        userRole:   user.role,
        reportDate,
        tasks:      tasks || '',
        notes:      notes || '',
        images,
        reviewed:   false,
      },
    },
  });

  await db.emailTemplate.upsert({
    where:  { slug: 'daily-report' },
    update: {},
    create: {
      slug:          'daily-report',
      triggerEvent:  'DAILY_REPORT',
      name:          'Daily Staff Report',
      subject:       'Daily Report — {{staff_name}} ({{report_date}})',
      heading:       'Staff Daily Report',
      content:       `<p>A new daily work report has been submitted.</p>
<p><strong>Staff Member:</strong> {{staff_name}}<br><strong>Role:</strong> {{staff_role}}<br><strong>Report Date:</strong> {{report_date}}</p>
<hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
<p><strong>Summary</strong><br>{{summary}}</p>
<p><strong>Tasks Completed</strong><br>{{tasks}}</p>
<p><strong>Additional Notes</strong><br>{{notes}}</p>`,
      recipientType: 'admin',
      isEnabled:     true,
    },
  });

  await sendNotification({
    trigger:   'DAILY_REPORT',
    recipient: '',
    data: {
      staff_name:  user.name || 'Staff',
      staff_role:  user.role,
      report_date: reportDate,
      summary,
      tasks:  tasks || 'N/A',
      notes:  notes || 'N/A',
    },
  });

  revalidatePath('/admin/reports');
  return { success: true, isDuplicate: false, message: 'Report submitted successfully!' };
}

// ─── Mark as Reviewed ────────────────────────────────────────────────────────
export async function markReportReviewed(reportId: string) {
  const session = await auth();
  if (!session?.user?.email) return { success: false };

  const reviewer = await db.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, role: true },
  });
  if (!reviewer || !ADMIN_ROLES.includes(reviewer.role)) return { success: false };

  const log = await db.systemLog.findUnique({ where: { id: reportId } });
  if (!log) return { success: false };

  const ctx = (log.context ?? {}) as Record<string, unknown>;

  await db.systemLog.update({
    where: { id: reportId },
    data: {
      context: {
        ...ctx,
        reviewed:   true,
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewer.name || 'Admin',
      } as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath('/admin/reports');
  return { success: true };
}

// ─── List (with filters) ─────────────────────────────────────────────────────
export async function getDailyReports(
  page = 1,
  filterUserId?: string,
  filters?: ReportFilters,
) {
  const take = 20;

  const allLogs = await db.systemLog.findMany({
    where: { source: 'DAILY_REPORT' },
    orderBy: { createdAt: 'desc' },
  });

  const parse = (log: typeof allLogs[number]): DailyReport => {
    const ctx = (log.context ?? {}) as Record<string, unknown>;
    const rawImages = ctx.images;
    const images = Array.isArray(rawImages)
      ? (rawImages as unknown[]).filter((u): u is string => typeof u === 'string')
      : [];
    return {
      id:         log.id,
      userName:   (ctx.userName   as string) ?? 'Unknown',
      userRole:   (ctx.userRole   as string) ?? '',
      reportDate: (ctx.reportDate as string) ?? '',
      summary:    log.message,
      tasks:      (ctx.tasks      as string) ?? '',
      notes:      (ctx.notes      as string) ?? '',
      images,
      createdAt:  log.createdAt,
      reviewed:   ctx.reviewed === 'true' || ctx.reviewed === true,
      reviewedAt: ctx.reviewedAt as string | undefined,
      reviewedBy: ctx.reviewedBy as string | undefined,
    };
  };

  let parsed = allLogs.map(parse);

  // Filter by userId (staff sees own)
  if (filterUserId) {
    parsed = parsed.filter(r => {
      const ctx = (allLogs.find(l => l.id === r.id)?.context ?? {}) as Record<string, string>;
      return ctx.userId === filterUserId;
    });
  }

  // Apply admin filters
  if (filters?.staffName) {
    const q = filters.staffName.toLowerCase();
    parsed = parsed.filter(r => r.userName.toLowerCase().includes(q));
  }
  if (filters?.fromDate) {
    parsed = parsed.filter(r => r.reportDate >= filters.fromDate!);
  }
  if (filters?.toDate) {
    parsed = parsed.filter(r => r.reportDate <= filters.toDate!);
  }
  if (filters?.reviewedFilter === 'reviewed') {
    parsed = parsed.filter(r => r.reviewed);
  } else if (filters?.reviewedFilter === 'pending') {
    parsed = parsed.filter(r => !r.reviewed);
  }

  const total      = parsed.length;
  const totalPages = Math.ceil(total / take);
  const skip       = (page - 1) * take;
  const reports    = parsed.slice(skip, skip + take);

  return { reports, total, totalPages };
}

// ─── Export CSV ──────────────────────────────────────────────────────────────
export async function exportReportsCSV(filters?: ReportFilters): Promise<string> {
  const session = await auth();
  if (!session?.user?.email) return '';

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (!user || !ADMIN_ROLES.includes(user.role)) return '';

  const { reports } = await getDailyReports(1, undefined, filters);
  // Fetch all — no pagination limit for export
  const allLogs = await db.systemLog.findMany({
    where: { source: 'DAILY_REPORT' },
    orderBy: { createdAt: 'desc' },
  });

  const parseAll = (log: typeof allLogs[number]): DailyReport => {
    const ctx = (log.context ?? {}) as Record<string, unknown>;
    const rawImgs = ctx.images;
    const images = Array.isArray(rawImgs)
      ? (rawImgs as unknown[]).filter((u): u is string => typeof u === 'string')
      : [];
    return {
      id:         log.id,
      userName:   (ctx.userName   as string) ?? 'Unknown',
      userRole:   (ctx.userRole   as string) ?? '',
      reportDate: (ctx.reportDate as string) ?? '',
      summary:    log.message,
      tasks:      (ctx.tasks      as string) ?? '',
      notes:      (ctx.notes      as string) ?? '',
      images,
      createdAt:  log.createdAt,
      reviewed:   ctx.reviewed === 'true' || ctx.reviewed === true,
      reviewedAt: ctx.reviewedAt as string | undefined,
      reviewedBy: ctx.reviewedBy as string | undefined,
    };
  };

  let all = allLogs.map(parseAll);

  if (filters?.staffName) {
    const q = filters.staffName.toLowerCase();
    all = all.filter(r => r.userName.toLowerCase().includes(q));
  }
  if (filters?.fromDate)  all = all.filter(r => r.reportDate >= filters.fromDate!);
  if (filters?.toDate)    all = all.filter(r => r.reportDate <= filters.toDate!);
  if (filters?.reviewedFilter === 'reviewed') all = all.filter(r => r.reviewed);
  if (filters?.reviewedFilter === 'pending')  all = all.filter(r => !r.reviewed);

  const header = ['Date', 'Staff Name', 'Role', 'Summary', 'Tasks Completed', 'Notes', 'Reviewed', 'Reviewed By', 'Reviewed At', 'Submitted At'];
  const rows = all.map(r => [
    csvCell(r.reportDate),
    csvCell(r.userName),
    csvCell(r.userRole),
    csvCell(r.summary),
    csvCell(r.tasks),
    csvCell(r.notes),
    r.reviewed ? 'Yes' : 'No',
    csvCell(r.reviewedBy),
    r.reviewedAt ? csvCell(new Date(r.reviewedAt).toLocaleDateString('en-AU')) : '',
    csvCell(new Date(r.createdAt).toLocaleString('en-AU')),
  ]);

  return [header.join(','), ...rows.map(r => r.join(','))].join('\n');
}
