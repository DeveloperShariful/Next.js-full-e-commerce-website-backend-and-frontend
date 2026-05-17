//app/(backend)/admin/_components/activity-feed.tsx

"use client";

import { Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  activities: any[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    // 🚀 WP Style Meta Box
    <div className="bg-white border border-[#c3c4c7] shadow-sm flex flex-col h-full">
      
      {/* Header */}
      <h2 className="px-4 py-2 border-b border-[#c3c4c7] text-[14px] font-semibold text-[#1d2327] bg-[#f6f7f7] flex items-center gap-2">
        <Activity size={16} className="text-[#8c8f94]" />
        System Activity
      </h2>

      <div className="p-0">
        {activities.length === 0 ? (
          <p className="text-center text-[#8c8f94] text-[13px] italic p-6">No activity logs recorded.</p>
        ) : (
          <ul className="divide-y divide-[#f0f0f1]">
            {activities.map((log, i) => (
              <li key={i} className="p-3 hover:bg-[#f6f7f7] transition-colors flex flex-col gap-1">
                <div className="flex justify-between items-start text-[12px]">
                  <span className="font-semibold text-[#2271b1]">
                    {log.user?.name || "System"}
                  </span>
                  <span className="text-[#8c8f94] whitespace-nowrap ml-2">
                    {formatDistanceToNow(new Date(log.createdAt))} ago
                  </span>
                </div>
                
                <p className="text-[13px] text-[#3c434a]">
                  {log.action} {log.entityType ? <span className="text-[#8c8f94]">— {log.entityType}</span> : ""}
                </p>

                {log.details && (
                  <div className="mt-1 text-[11px] bg-[#f0f0f1] p-1.5 rounded-sm text-[#50575e] font-mono border border-[#e2e4e7] truncate max-w-full">
                    {JSON.stringify(log.details)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}