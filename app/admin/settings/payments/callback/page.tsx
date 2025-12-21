// app/admin/settings/payments/callback/page.tsx
import { stripeOAuthExchange } from "@/app/actions/settings/payments/stripe/oauth-connect"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface CallbackPageProps {
  searchParams: {
    code?: string
    state?: string // We passed methodId as state
    error?: string
    error_description?: string
  }
}

export default async function PaymentCallbackPage({ searchParams }: CallbackPageProps) {
  // 1. Handle Errors returned from Provider
  if (searchParams.error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-[400px] border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Connection Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {searchParams.error_description || "The provider rejected the connection request."}
            </p>
            <a 
              href="/admin/settings/payments" 
              className="text-sm font-medium underline hover:text-primary"
            >
              Return to Settings
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 2. Validate Params
  if (!searchParams.code || !searchParams.state) {
    redirect("/admin/settings/payments")
  }

  // 3. Exchange Code (Server Action)
  // Note: Currently logic handles Stripe. If you add PayPal OAuth later, verify 'state' or add a 'provider' param.
  const result = await stripeOAuthExchange(searchParams.state, searchParams.code)

  if (result.success) {
    // Success! Redirect back to settings
    redirect("/admin/settings/payments?success=true")
  } else {
    // Show Error Page
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Connection Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Failed to finalize the connection: {result.error}
            </p>
            <a 
              href="/admin/settings/payments" 
              className="text-sm font-medium underline hover:text-primary"
            >
              Return to Settings
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading State (While processing on server)
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <h2 className="text-xl font-semibold">Connecting Account...</h2>
        <p className="text-gray-500">Please wait while we secure your credentials.</p>
      </div>
    </div>
  )
}