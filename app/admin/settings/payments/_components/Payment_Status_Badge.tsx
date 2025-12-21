// app/admin/settings/payments/_components/Payment_Status_Badge.tsx
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PaymentStatusBadgeProps {
  isEnabled: boolean
  mode?: "TEST" | "LIVE"
}

export const Payment_Status_Badge = ({ isEnabled, mode }: PaymentStatusBadgeProps) => {
  if (!isEnabled) {
    return (
      <Badge variant="outline" className="text-muted-foreground border-dashed">
        Inactive
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        Active
      </Badge>
      
      {mode === "TEST" && (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
          Test Mode
        </Badge>
      )}
    </div>
  )
}