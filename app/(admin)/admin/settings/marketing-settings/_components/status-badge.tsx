// File: app/(admin)/admin/settings/marketing-settings/_components/status-badge.tsx
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface StatusBadgeProps {
  isEnabled: boolean;
  isVerified: boolean;
}

export function StatusBadge({ isEnabled, isVerified }: StatusBadgeProps) {
  if (!isEnabled) {
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-100 text-slate-500 border-slate-200">
            <XCircle className="w-3.5 h-3.5" />
            Disabled
        </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        isVerified
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-700 border-red-200"
      )}
    >
      {isVerified ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Connected
        </>
      ) : (
        <>
          <AlertCircle className="w-3.5 h-3.5" />
          Not Connected
        </>
      )}
    </div>
  );
}