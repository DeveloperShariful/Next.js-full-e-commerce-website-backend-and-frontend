// app/admin/settings/payments/_components/Payment_Gateways/Paypal/Paypal_Advanced.tsx
"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PaypalSettingsSchema } from "@/app/admin/settings/payments/schemas"
import { updatePaypalSettings } from "@/app/actions/settings/payments/paypal/update-settings"
import { PaymentMethodWithConfig, PaypalConfigType } from "@/app/admin/settings/payments/types"
import { z } from "zod"
import { toast } from "sonner"

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// 👇 FIX: Imported from dedicated Paypal components
import { Paypal_Save_Sticky_Bar } from "./Components/Paypal_Save_Sticky_Bar"
import { Paypal_Debug_Log_Viewer } from "./Components/Paypal_Debug_Log_Viewer"

interface AdvancedProps {
  method: PaymentMethodWithConfig
  config: PaypalConfigType
}

export const Paypal_Advanced = ({ method, config }: AdvancedProps) => {
  const [isPending, startTransition] = useTransition()

  const form = useForm<z.infer<typeof PaypalSettingsSchema>>({
    resolver: zodResolver(PaypalSettingsSchema),
    defaultValues: {
      invoicePrefix: config.invoicePrefix || "WC-",
      debugLog: !!config.debugLog,
      
      // Defaults
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

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="invoicePrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Prefix</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      Added to invoice numbers sent to PayPal to prevent duplicate invoice errors (e.g., WC-).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="debugLog"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Debug Logging</FormLabel>
                      <FormDescription>
                        Log PayPal events, such as IPN requests, inside System Logs.
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
          
          {/* 👇 FIX: Used dedicated sticky bar */}
          <Paypal_Save_Sticky_Bar onSave={form.handleSubmit(onSubmit)} isPending={isPending} />
        </form>
      </Form>

      <Card>
        <CardHeader>
          <CardTitle>PayPal Debug Logs</CardTitle>
          <CardDescription>Recent API interaction logs.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 👇 FIX: Used dedicated log viewer (no source prop needed) */}
          <Paypal_Debug_Log_Viewer />
        </CardContent>
      </Card>
    </div>
  )
}