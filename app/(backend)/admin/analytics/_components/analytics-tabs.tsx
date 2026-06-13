//File: app/(backend)/admin/analytics/_components/analytics-tabs.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ন্যাভিগেশন লিংকগুলোর স্ট্রিক্ট টাইপ
interface TabItem {
  name: string;
  href: string;
}

const tabs: TabItem[] = [
  { name: "Overview", href: "/admin/analytics" },
  { name: "Products", href: "/admin/analytics/products" },
  { name: "Revenue", href: "/admin/analytics/revenue" },
  { name: "Orders", href: "/admin/analytics/orders" },
  { name: "Categories", href: "/admin/analytics/categories" },
  { name: "Coupons", href: "/admin/analytics/coupons" },
];

export default function AnalyticsTabs() {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-gray-300 px-6 pt-3 shadow-sm">
      <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          // রুট পাথ এবং সাব-পাথ চেক করা হচ্ছে
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/admin/analytics" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                whitespace-nowrap pb-3 px-1 text-[15px] font-medium transition-colors duration-200
                ${
                  isActive
                    ? "border-b-4 border-[#2271b1] text-[#1d2327]" // WordPress Blue and Dark Text
                    : "border-b-4 border-transparent text-[#50575e] hover:text-[#2271b1]"
                }
              `}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}