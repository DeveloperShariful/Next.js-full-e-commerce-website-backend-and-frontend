//app/(backend)/admin/page.tsx

// app/(backend)/admin/page.tsx

import { getDashboardOverview } from "@/app/actions/backend/dashboard";
import { DashboardView } from "./_components/dashboard-view";
import { db } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  
  // 1. Fetch EVERYTHING from database directly (Existing Dashboard Data)
  const rawData = await getDashboardOverview();

  if (!rawData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#d63638] font-bold">
        Error loading dashboard data. Check database connection.
      </div>
    );
  }

  // 🛑 OPTIMIZATION: Combine all queries with Promise.all to reduce waterfall delay
  const [totalClaims, pendingClaims, approvedClaims, recentClaims] = await Promise.all([
    db.warrantyClaim.count({ where: { status: { not: 'TRASHED' } } }),
    db.warrantyClaim.count({ where: { status: 'PENDING' } }),
    db.warrantyClaim.count({ where: { status: 'APPROVED' } }),
    db.warrantyClaim.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, status: true, createdAt: true }, 
    })
  ]);

  // Merge all data
  const mergedData = {
    ...rawData,
    claims: {
      total: totalClaims,
      pending: pendingClaims,
      approved: approvedClaims,
      recent: recentClaims
    }
  };

  // Serialize data before passing to client components
  // এটি Prisma-র Decimal এবং Date অবজেক্টগুলোকে প্লেইন JSON এ কনভার্ট করে
  const data = JSON.parse(JSON.stringify(mergedData));

  // Pass sanitized data to the client component
  return <DashboardView data={data} />
}