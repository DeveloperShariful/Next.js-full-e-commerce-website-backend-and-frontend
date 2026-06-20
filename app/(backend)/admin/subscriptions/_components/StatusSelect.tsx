"use client";

import { useState, useTransition } from "react";
import { updateSubscriptionStatus } from "@/app/actions/backend/subscriptions/subscription-actions";
import { SubscriptionStatus } from "@prisma/client";
import { Loader2, Check } from "lucide-react";

const STATUS_OPTIONS: SubscriptionStatus[] = [
  "ACTIVE",
  "PAUSED",
  "CANCELLED",
  "EXPIRED",
  "PAST_DUE",
  "TRIALLING",
];

interface StatusSelectProps {
  subscriptionId: string;
  currentStatus: SubscriptionStatus;
}

export default function StatusSelect({ subscriptionId, currentStatus }: StatusSelectProps) {
  const [status, setStatus] = useState<SubscriptionStatus>(currentStatus);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: SubscriptionStatus) => {
    if (value === status) return;
    const prev = status;
    setStatus(value);
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateSubscriptionStatus(subscriptionId, value);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setStatus(prev);
        setError(result.message);
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as SubscriptionStatus)}
        className="px-2 py-1 border border-[#8c8f94] rounded-sm text-[12px] outline-none focus:border-[#2271b1] bg-white disabled:opacity-60 cursor-pointer"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2271b1]" />}
      {saved && !isPending && <Check className="w-3.5 h-3.5 text-[#00a32a]" />}
      {error && <span className="text-[11px] text-[#d63638]">{error}</span>}
    </div>
  );
}
