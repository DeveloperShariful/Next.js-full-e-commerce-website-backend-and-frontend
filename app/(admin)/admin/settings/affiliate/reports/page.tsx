//app/(admin)/admin/settings/affiliate/reports/page.tsx

import { analyticsService } from "@/app/actions/admin/settings/affiliates/_services/analytics-service";
import ReportsDashboard from "@/app/(admin)/admin/settings/affiliate/_components/features/analytics/reports-dashboard";
import { BarChart2 } from "lucide-react";

export const metadata = {
  title: "Advanced Reports | Affiliate Admin",
};

export default async function ReportsPage() {
  const [products, traffic, affiliates, monthly] = await Promise.all([
    analyticsService.getTopProducts(),
    analyticsService.getTrafficSources(),
    analyticsService.getTopAffiliates(),
    analyticsService.getMonthlyPerformance(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-600" />
            Advanced Analytics
          </h2>
          <p className="text-sm text-gray-500">
            Deep dive into traffic sources, product performance, and revenue trends.
          </p>
        </div>
      </div>
      
      <div className="h-px bg-gray-200" />

      <ReportsDashboard 
        topProducts={products}
        trafficSources={traffic}
        topAffiliates={affiliates}
        monthlyStats={monthly}
      />
    </div>
  );
}