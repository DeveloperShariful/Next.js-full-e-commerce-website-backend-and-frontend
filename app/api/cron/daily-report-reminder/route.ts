import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const STAFF_ROLES = ['MANAGER', 'EDITOR', 'SUPPORT'];

export async function GET(request: Request) {
  // Bearer token check
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only run on weekdays (Mon–Fri)
  const dayOfWeek = new Date().getDay(); // 0=Sun, 6=Sat
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return NextResponse.json({ skipped: true, reason: 'Weekend' });
  }

  const today = new Date().toISOString().split('T')[0];
  const todayStart = new Date(today + 'T00:00:00.000Z');

  // Get all active staff users who should submit reports
  const staffUsers = await db.user.findMany({
    where: {
      role:     { in: STAFF_ROLES as never[] },
      isActive: true,
      email:    { not: undefined },
    },
    select: { id: true, name: true, email: true },
  });

  if (staffUsers.length === 0) {
    return NextResponse.json({ sent: 0, reason: 'No staff users found' });
  }

  // Get today's submitted reports
  const todayLogs = await db.systemLog.findMany({
    where: { source: 'DAILY_REPORT', createdAt: { gte: todayStart } },
    select: { context: true },
  });

  const submittedUserIds = new Set(
    todayLogs.map(l => ((l.context ?? {}) as Record<string, string>).userId).filter(Boolean)
  );

  // Find staff who haven't submitted today
  const pending = staffUsers.filter(u => !submittedUserIds.has(u.id));

  if (pending.length === 0) {
    return NextResponse.json({ sent: 0, reason: 'All staff submitted today' });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Ensure reminder template exists
  await db.emailTemplate.upsert({
    where:  { slug: 'daily-report-reminder' },
    update: {},
    create: {
      slug:          'daily-report-reminder',
      triggerEvent:  'DAILY_REPORT_REMINDER',
      name:          'Daily Report Reminder',
      subject:       'Reminder: Please submit your daily report for {{report_date}}',
      heading:       'Daily Report Reminder',
      content:       `<p>Hi {{staff_name}},</p>
<p>This is a friendly reminder that you haven't submitted your daily work report for <strong>{{report_date}}</strong> yet.</p>
<p>Please take a few minutes to submit your report so the admin stays updated on your work.</p>
<p>Click the button below to submit your report now.</p>`,
      recipientType: 'customer',
      isEnabled:     true,
    },
  });

  // Send reminder to each pending staff member
  const { sendNotification } = await import('@/app/api/email/send-notification');
  let sent = 0;

  for (const staff of pending) {
    try {
      await sendNotification({
        trigger:   'DAILY_REPORT_REMINDER',
        recipient: staff.email,
        data: {
          staff_name:  staff.name || 'Team Member',
          report_date: today,
          submit_url:  `${appUrl}/admin/reports`,
        },
      });
      sent++;
    } catch {
      // continue to next staff
    }
  }

  // Log the reminder run
  await db.systemLog.create({
    data: {
      level:   'INFO',
      source:  'DAILY_REPORT_REMINDER_CRON',
      message: `Sent ${sent} reminder(s) for ${today}`,
      context: {
        date:          today,
        totalStaff:    staffUsers.length,
        submitted:     submittedUserIds.size,
        remindersSent: sent,
        pendingUsers:  pending.map(u => u.name || u.email),
      },
    },
  });

  return NextResponse.json({
    success:      true,
    date:         today,
    totalStaff:   staffUsers.length,
    submitted:    submittedUserIds.size,
    reminderSent: sent,
  });
}
