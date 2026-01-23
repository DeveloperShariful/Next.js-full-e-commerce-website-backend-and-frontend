//app/(admin)/admin/page.tsx

import { getDashboardOverview } from "@/app/actions/admin/dashboard"
import { DashboardView } from "./_components/dashboard-view";

export default async function AdminDashboardPage() {
  
  // Fetch EVERYTHING from database directly (No params)
  const rawData = await getDashboardOverview();

  if (!rawData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">
        Error loading dashboard data. Check database connection.
      </div>
    );
  }

  // ✅ FIX: Serialize data before passing to client components
  // এটি Prisma-র Decimal এবং Date অবজেক্টগুলোকে প্লেইন JSON এ কনভার্ট করে
  const data = JSON.parse(JSON.stringify(rawData));

  // Pass sanitized data to the client component
  return <DashboardView data={data} />;
}