// app/admin/settings/payments/_components/Paypal/Paypal_PayLater.tsx

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

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface PayLaterProps {
  method: PaymentMethodWithConfig
  config: PaypalConfigType
}

export const Paypal_PayLater = ({ method, config }: PayLaterProps) => {
  const [isPending, startTransition] = useTransition()

  const form = useForm({
    resolver: zodResolver(PaypalSettingsSchema),
    defaultValues: {
      payLaterEnabled: config.payLaterEnabled ?? true,
      payLaterMessaging: config.payLaterMessaging ?? true,
      payLaterMessageTheme: config.payLaterMessageTheme || "light",
      
      // Other Defaults (Required for Schema Validation)
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
      payLaterLocations: config.payLaterLocations || [],
      invoicePrefix: config.invoicePrefix || "",
      debugLog: !!config.debugLog,
      
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
            toast.success("Pay Later settings saved")
          } else {
            toast.error(data.error)
          }
        })
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
        <Card>
          <CardHeader>
            <CardTitle>PayPal Pay Later</CardTitle>
            <CardDescription>
              Offer your customers flexible payment options (Buy Now, Pay Later).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              
              {/* Enable Pay Later */}
              <FormField
                control={form.control}
                name="payLaterEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Pay Later</FormLabel>
                      <FormDescription>
                        Show "Pay Later" button at checkout.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Enable Messaging*/}
              <FormField
                control={form.control}
                name="payLaterMessaging"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Messaging</FormLabel>
                      <FormDescription>
                        Show "Pay in 4 installments" messages on product pages and cart.
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
  )
}