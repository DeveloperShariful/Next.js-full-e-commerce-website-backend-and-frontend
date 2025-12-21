// app/admin/settings/payments/_components/Payment_Gateways/Paypal/Paypal_PayLater.tsx
"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PaypalSettingsSchema } from "@/app/admin/settings/payments/schemas"
import { updatePaypalSettings } from "@/app/actions/settings/payments/paypal/update-settings"
import { PaymentMethodWithConfig, PaypalConfigType } from "@/app/admin/settings/payments/types"
import { z } from "zod"
import { toast } from "sonner"

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// 👇 FIX: Imported from dedicated Paypal components
import { Paypal_Save_Sticky_Bar } from "./Components/Paypal_Save_Sticky_Bar"

interface PayLaterProps {
  method: PaymentMethodWithConfig
  config: PaypalConfigType
}

export const Paypal_PayLater = ({ method, config }: PayLaterProps) => {
  const [isPending, startTransition] = useTransition()

  // ... (useForm Logic same as before) ...
  const form = useForm<z.infer<typeof PaypalSettingsSchema>>({
    resolver: zodResolver(PaypalSettingsSchema),
    defaultValues: {
      payLaterEnabled: config.payLaterEnabled ?? true,
      payLaterMessaging: config.payLaterMessaging ?? true,
      payLaterMessageTheme: config.payLaterMessageTheme || "light",
      // ... defaults ...
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
          <CardContent className="space-y-4">
             {/* ... Fields ... */}
          </CardContent>
        </Card>

        {/* 👇 FIX: Used dedicated sticky bar */}
        <Paypal_Save_Sticky_Bar onSave={form.handleSubmit(onSubmit)} isPending={isPending} />
      </form>
    </Form>
  )
}