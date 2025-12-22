// app/admin/settings/payments/_components/Payment_Gateways/Paypal/Paypal_Advanced.tsx
"use client"

import { useTransition, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PaypalSettingsSchema } from "@/app/admin/settings/payments/schemas"
import { updatePaypalSettings } from "@/app/actions/settings/payments/paypal/update-settings"
import { PaymentMethodWithConfig, PaypalConfigType } from "@/app/admin/settings/payments/types"
import { z } from "zod"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react" // 👈 Import Refresh Icon

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Components
import { Paypal_Save_Sticky_Bar } from "./Components/Paypal_Save_Sticky_Bar"
import { Paypal_Debug_Log_Viewer } from "./Components/Paypal_Debug_Log_Viewer"

interface AdvancedProps {
  method: PaymentMethodWithConfig
  config: PaypalConfigType
}

export const Paypal_Advanced = ({ method, config }: AdvancedProps) => {
  const [isPending, startTransition] = useTransition()
  
  // 👇 State to force refresh the logs
  const [logRefreshKey, setLogRefreshKey] = useState(0)

  const form = useForm<z.infer<typeof PaypalSettingsSchema>>({
    resolver: zodResolver(PaypalSettingsSchema),
    defaultValues: {
      invoicePrefix: config.invoicePrefix || "WC-",
      debugLog: !!config.debugLog,
      
      // Hidden / Defaults fields required for Schema validation
      sandbox: !!config.sandbox,
      title: method.name || "",
      description: method.description || "",
      liveEmail: config.liveEmail || "",
      liveClientId: config.liveClientId || "",
      liveClientSecret: config.liveClientSecret || "",
      sandboxEmail: config.sandboxEmail || "",
      sandboxClientId: config.sandboxClientId || "",
      sandboxClientSecret: config.sandboxClientSecret || "",
      intent: config.intent || "CAPTURE",
      instantPayments: !!config.instantPayments,
      brandName: config.brandName || "",
      landingPage: config.landingPage || "LOGIN",
      disableFunding: config.disableFunding || [],
      advancedCardEnabled: !!config.advancedCardEnabled,
      advancedCardTitle: config.advancedCardTitle || "",
      vaultingEnabled: !!config.vaultingEnabled,
      smartButtonLocations: config.smartButtonLocations || [],
      requireFinalConfirmation: config.requireFinalConfirmation ?? true,
      buttonLabel: config.buttonLabel || "PAYPAL",
      buttonLayout: config.buttonLayout || "VERTICAL",
      buttonColor: config.buttonColor || "GOLD",
      buttonShape: config.buttonShape || "RECT",
      payLaterEnabled: config.payLaterEnabled ?? true,
      payLaterLocations: config.payLaterLocations || [],
      payLaterMessaging: config.payLaterMessaging ?? true,
      payLaterMessageTheme: config.payLaterMessageTheme || "light",
    }
  })

  const onSubmit = (values: z.infer<typeof PaypalSettingsSchema>) => {
    startTransition(() => {
      updatePaypalSettings(method.id, values)
        .then((data) => {
          if (data.success) {
            toast.success("Advanced settings saved")
          } else {
            toast.error(data.error)
          }
        })
    })
  }

  // 👇 Function to refresh logs manually
  const handleRefreshLogs = (e: React.MouseEvent) => {
    e.preventDefault()
    setLogRefreshKey(prev => prev + 1) // Changing key forces component re-mount
    toast.info("Refreshing logs...")
  }

  return (
    <div className="space-y-6 pb-20">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Options</CardTitle>
              <CardDescription>Configure technical parameters for PayPal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Invoice Prefix Field */}
              <FormField
                control={form.control}
                name="invoicePrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Prefix</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="e.g. GOBIKE-" />
                    </FormControl>
                    <FormDescription>
                      Added to invoice numbers sent to PayPal to prevent "Duplicate Invoice ID" errors (e.g., WC-, GB-).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Debug Logging Switch */}
              <FormField
                control={form.control}
                name="debugLog"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Debug Logging</FormLabel>
                      <FormDescription>
                        Save detailed PayPal API responses to System Logs. Useful for troubleshooting errors.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Paypal_Save_Sticky_Bar onSave={form.handleSubmit(onSubmit)} isPending={isPending} />
        </form>
      </Form>

      {/* Logs Viewer Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle>PayPal Debug Logs</CardTitle>
            <CardDescription>Recent system events and API interactions.</CardDescription>
          </div>
          {/* 👇 Refresh Button added here */}
          <Button variant="outline" size="sm" onClick={handleRefreshLogs} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {/* Passing the key forces the viewer to re-fetch when button is clicked */}
          <Paypal_Debug_Log_Viewer key={logRefreshKey} />
        </CardContent>
      </Card>
    </div>
  )
}