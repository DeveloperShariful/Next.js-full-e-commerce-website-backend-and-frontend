//File: app/(backend)/admin/analytics/_components/overview-leaderboards.tsx

import React from "react";
import Link from "next/link";
import { 
  LeaderboardsResponse 
} from "@/app/actions/backend/analytics/leaderboards.actions";
import { formatCurrency, formatNumber } from "@/app/actions/backend/analytics/shared.utils";

interface OverviewLeaderboardsProps {
  data: LeaderboardsResponse;
}

export default function OverviewLeaderboards({ data }: OverviewLeaderboardsProps) {
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[18px] text-[#1d2327] font-normal">Leaderboards</h2>
        <button className="text-[#50575e] hover:text-[#1d2327]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Categories Table */}
        <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-sm">
          <h3 className="text-[14px] font-semibold text-[#1d2327] p-4 border-b border-[#c3c4c7]">
            Top categories - Items sold
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-[#2c3338]">
              <thead>
                <tr className="border-b border-[#c3c4c7] bg-[#f8f9f9]">
                  <th className="font-semibold py-2.5 px-4">Category</th>
                  <th className="font-semibold py-2.5 px-4 text-right">Items sold</th>
                  <th className="font-semibold py-2.5 px-4 text-right">Net sales</th>
                </tr>
              </thead>
              <tbody>
                {data.topCategories.length > 0 ? (
                  data.topCategories.map((category, index) => (
                    <tr 
                      key={category.id} 
                      className={index !== data.topCategories.length - 1 ? "border-b border-[#f0f0f1]" : ""}
                    >
                      <td className="py-3 px-4">
                        <Link href={`/admin/analytics/categories?filter=${category.id}`} className="text-[#2271b1] hover:text-[#135e96] hover:underline">
                          {category.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right">{formatNumber(category.itemsSold)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(category.netSales)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-[#646970]">No data found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-sm">
          <h3 className="text-[14px] font-semibold text-[#1d2327] p-4 border-b border-[#c3c4c7]">
            Top products - Items sold
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-[#2c3338]">
              <thead>
                <tr className="border-b border-[#c3c4c7] bg-[#f8f9f9]">
                  <th className="font-semibold py-2.5 px-4">Product</th>
                  <th className="font-semibold py-2.5 px-4 text-right">Items sold</th>
                  <th className="font-semibold py-2.5 px-4 text-right">Net sales</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.length > 0 ? (
                  data.topProducts.map((product, index) => (
                    <tr 
                      key={product.id} 
                      className={index !== data.topProducts.length - 1 ? "border-b border-[#f0f0f1]" : ""}
                    >
                      <td className="py-3 px-4 max-w-[250px] truncate">
                        <Link href={`/admin/analytics/products?filter=${product.id}`} className="text-[#2271b1] hover:text-[#135e96] hover:underline">
                          {product.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right">{formatNumber(product.itemsSold)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(product.netSales)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-[#646970]">No data found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}