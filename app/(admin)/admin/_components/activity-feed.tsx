//app/(admin)/admin/_components/activity-feed.tsx

"use client";

import { Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  activities: any[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex items-center gap-2">
        <Activity size={18} className="text-slate-400" />
        <h3 className="font-bold text-lg text-slate-800">System Activity</h3>
      </div>

      <div className="p-6">
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
           {activities.length === 0 ? (
              <p className="text-center text-slate-400 text-xs italic">No activity logs recorded.</p>
           ) : (
             activities.map((log, i) => (
                <div key={i} className="relative flex items-start group">
                   <div className="absolute left-0 top-1 h-2 w-2 rounded-full border border-white bg-slate-300 shadow ring-4 ring-white group-hover:bg-blue-500 transition"></div>
                   <div className="ml-6 pl-4 flex-1">
                      <p className="text-xs text-slate-500 mb-0.5">
                         <span className="font-bold text-slate-700">{log.user?.name || "System"}</span>
                         <span className="mx-1">•</span>
                         {formatDistanceToNow(new Date(log.createdAt))} ago
                      </p>
                      <p className="text-sm text-slate-700 font-medium">
                         {log.action} <span className="text-slate-500 font-normal">{log.entityType ? `- ${log.entityType}` : ""}</span>
                      </p>
                      {log.details && (
                         <div className="mt-1 text-[10px] bg-slate-50 p-2 rounded text-slate-500 font-mono border border-slate-100 truncate max-w-[200px]">
                            {JSON.stringify(log.details)}
                         </div>
                      )}
                   </div>
                </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}