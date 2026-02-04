// app/admin/settings/payments/_components/Paypal/Paypal_Advanced.tsx

"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PaypalSettingsSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { updatePaypalSettings } from "@/app/actions/admin/settings/payments/paypal/update-settings"
import { PaymentMethodWithConfig, PaypalConfigType } from "@/app/(admin)/admin/settings/payments/types"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react" 

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AdvancedProps {
  method: PaymentMethodWithConfig
  config: PaypalConfigType
}

export const Paypal_Advanced = ({ method, config }: AdvancedProps) => {
  const [isPending, startTransition] = useTransition()
  
  const form = useForm({
    resolver: zodResolver(PaypalSettingsSchema),
    defaultValues: {
      invoicePrefix: config.invoicePrefix || "WC-",
      debugLog: !!config.debugLog,
      
      // Hidden / Defaults fields required for Schema validation
      isEnabled: method.isEnabled,
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
      subtotalMismatchBehavior: config.subtotalMismatchBehavior || "add_line_item",
      
      minOrderAmount: method.minOrderAmount ?? null,
      maxOrderAmount: method.maxOrderAmount ?? null,
      surchargeEnabled: method.surchargeEnabled ?? false,
      surchargeType: (method.surchargeType as "fixed" | "percentage" | null) ?? "fixed",
      surchargeAmount: method.surchargeAmount ?? 0,
      taxableSurcharge: method.taxableSurcharge ?? false
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
          
          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}