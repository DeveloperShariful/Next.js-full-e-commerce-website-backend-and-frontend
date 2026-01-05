//app/(admin)/admin/page.tsx

import { getDashboardOverview } from "@/app/actions/admin/dashboard"
import { DashboardView } from "./_components/dashboard-view";

export default async function AdminDashboardPage() {
  
  // Fetch EVERYTHING from database directly (No params)
  const data = await getDashboardOverview();

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">
        Error loading dashboard data. Check database connection.
      </div>
    );
  }

  // Pass all data to the client component
  return <DashboardView data={data} />;
}