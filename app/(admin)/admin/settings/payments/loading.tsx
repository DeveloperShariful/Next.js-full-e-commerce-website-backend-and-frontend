// app/admin/settings/payments/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function PaymentSettingsLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="mx-auto w-full max-w-5xl space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="mx-auto w-full max-w-5xl space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg border" />
        ))}
      </div>
    </div>
  )
}