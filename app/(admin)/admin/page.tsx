//app/(admin)/admin/page.tsx

import { getDashboardOverview } from "@/app/actions/admin/dashboard";
import { DashboardView } from "./_components/dashboard-view";
import { db } from "@/lib/prisma"; // ডাটাবেস কানেকশন

// ড্যাশবোর্ড সবসময় ফ্রেশ ডেটা দেখাবে
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

  // 2. ডাটাবেস থেকে Warranty Claims এর রিয়েল-টাইম কাউন্ট নিয়ে আসা হচ্ছে (TRASHED বাদে)
  const totalClaims = await db.warrantyClaim.count({ where: { status: { not: 'TRASHED' } } });
  const pendingClaims = await db.warrantyClaim.count({ where: { status: 'PENDING' } });
  const approvedClaims = await db.warrantyClaim.count({ where: { status: 'APPROVED' } });

  // 3. Recent Activity এর জন্য সর্বশেষ ৫টি ক্লেম আনা হচ্ছে
  const recentClaims = await db.warrantyClaim.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, status: true, createdAt: true }, 
  });

  // 4. Merge all data
  const mergedData = {
    ...rawData,
    claims: {
      total: totalClaims,
      pending: pendingClaims,
      approved: approvedClaims,
      recent: recentClaims
    }
  };

  // ✅ FIX: Serialize data before passing to client components
  // এটি Prisma-র Decimal এবং Date অবজেক্টগুলোকে প্লেইন JSON এ কনভার্ট করে
  const data = JSON.parse(JSON.stringify(mergedData));

  // Pass sanitized data to the client component
  return <DashboardView data={data} />;
}