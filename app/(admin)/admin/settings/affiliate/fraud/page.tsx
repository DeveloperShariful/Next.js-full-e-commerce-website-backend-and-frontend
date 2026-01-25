//app/(admin)/admin/settings/affiliate/fraud/page.tsx

import { fraudService } from "@/app/actions/admin/settings/affiliates/_services/fraud-service";
import { fraudRuleService } from "@/app/actions/admin/settings/affiliates/_services/fraud-rule-service";
import FraudRuleManager from "@/app/(admin)/admin/settings/affiliate/_components/features/fraud/fraud-rule-manager";
import { ShieldAlert, AlertTriangle, Search, Ban, Settings, Activity } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Fraud Shield | Affiliate Admin",
};

export default async function FraudShieldPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const currentView = params.view || "monitor"; // Default to Monitor

  // Parallel Data Fetching
  const [highRiskUsers, flaggedReferrals, rules] = await Promise.all([
    fraudService.getHighRiskAffiliates(),
    fraudService.getFlaggedReferrals(),
    fraudRuleService.getRules(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            Fraud Shield
          </h2>
          <p className="text-sm text-gray-500">
            AI-driven security system to detect and block suspicious activities.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link
            href="/admin/settings/affiliate/fraud?view=monitor"
            className={cn(
              "whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2",
              currentView === "monitor"
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <Activity className="w-4 h-4" />
            Live Monitor
          </Link>
          <Link
            href="/admin/settings/affiliate/fraud?view=rules"
            className={cn(
              "whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2",
              currentView === "rules"
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <Settings className="w-4 h-4" />
            Configuration & Rules
          </Link>
        </nav>
      </div>

      {/* VIEW: MONITOR */}
      {currentView === "monitor" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
          
          {/* Section 1: High Risk Accounts */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              High Risk Affiliates (Score &gt; 50)
            </h3>
            
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">Affiliate</th>
                      <th className="px-6 py-3">Risk Score</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {highRiskUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">
                          <p>No high-risk accounts detected. Network is healthy.</p>
                        </td>
                      </tr>
                    ) : (
                      highRiskUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-red-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{user.user.name || "Unknown"}</div>
                            <div className="text-xs text-gray-500">{user.user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-full max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${user.riskScore > 80 ? 'bg-red-600' : 'bg-orange-500'}`} 
                                  style={{ width: `${user.riskScore}%` }}
                                />
                              </div>
                              <span className="font-bold text-gray-700">{user.riskScore}/100</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-xs bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-50">
                              Review
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 2: Flagged Transactions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-500" />
              Flagged Transactions
            </h3>

            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Order ID</th>
                    <th className="px-6 py-3">Affiliate</th>
                    <th className="px-6 py-3">Reason</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3 text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {flaggedReferrals.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-500">No flagged transactions found.</td></tr>
                  ) : (
                    flaggedReferrals.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-xs">{item.order.orderNumber}</td>
                        <td className="px-6 py-4">{item.affiliate.user.name}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                            <Ban className="w-3 h-3" />
                            {item.flagReason || "Suspicious Activity"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {format(new Date(item.createdAt), "dd MMM yyyy")}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button className="text-xs text-red-600 hover:underline">Reject</button>
                          <span className="text-gray-300">|</span>
                          <button className="text-xs text-green-600 hover:underline">Approve</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: RULES */}
      {currentView === "rules" && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <FraudRuleManager initialRules={rules} />
        </div>
      )}
    </div>
  );
}