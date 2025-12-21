// app/admin/settings/payments/_components/Payment_Header.tsx
"use client"
import { Button } from "@/components/ui/button"
import { resetPaymentMethodsDB } from "@/app/actions/settings/payments/reset-db"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export const Payment_Header = () => {
  const router = useRouter()
  
  const handleReset = async () => {
    if(!confirm("Fix missing methods? This will reset payment settings.")) return;
    const res = await resetPaymentMethodsDB()
    if(res.success) {
      toast.success("Database Repaired!")
      router.refresh()
    } else {
      toast.error("Failed to repair")
    }
  }

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mx-auto w-full max-w-6xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Payment Providers</h1>
        <p className="text-muted-foreground text-sm">
          Manage how your customers pay at checkout.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Repair Database
      </Button>
    </div>
  )
}