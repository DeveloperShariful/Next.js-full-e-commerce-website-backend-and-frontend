//app/admin/loading.tsx

import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="h-[calc(100vh-100px)] w-full flex flex-col items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-4 p-8">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <div className="flex flex-col items-center gap-1">
          <h3 className="text-sm font-bold text-slate-800">Please wait</h3>
          <p className="text-xs text-slate-500">Loading dashboard data...</p>
        </div>
      </div>
    </div>
  );
}