//File: app/(backend)/admin/visitors/_components/breakdown-table.tsx

import React from "react";
import { formatNumber } from "@/app/actions/backend/analytics/shared.utils";

interface Row {
  label: string;
  count: number;
  percentage: number;
}

interface Props {
  title: string;
  labelHeader: string;
  rows: Row[];
}

export default function BreakdownTable({ title, labelHeader, rows }: Props) {
  return (
    <div className="border border-[#c3c4c7] shadow-sm rounded-sm overflow-hidden bg-white flex flex-col h-full">
      <div className="p-4 border-b border-[#c3c4c7] bg-[#f8f9f9]">
        <span className="text-[13px] font-semibold text-[#1d2327]">{title}</span>
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-[13px] text-[#646970]">No data for this period yet.</p>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f6f7f7]">
              <th className="py-2 px-4 text-[12px] font-medium text-[#646970] border-b border-[#c3c4c7]">{labelHeader}</th>
              <th className="py-2 px-4 text-[12px] font-medium text-[#646970] border-b border-[#c3c4c7] text-right">Visits</th>
              <th className="py-2 px-4 text-[12px] font-medium text-[#646970] border-b border-[#c3c4c7] text-right">Share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="hover:bg-[#f6f7f7] border-b border-[#f0f0f1] last:border-b-0">
                <td className="py-2 px-4 text-[13px] text-[#2c3338] capitalize">{row.label}</td>
                <td className="py-2 px-4 text-[13px] text-[#2c3338] text-right">{formatNumber(row.count)}</td>
                <td className="py-2 px-4 text-[13px] text-[#2c3338] text-right">{row.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
