// app/admin/settings/payments/_components/Payment_Gateways/Stripe/Stripe_Advanced.tsx
"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { StripeSettingsSchema } from "@/app/admin/settings/payments/schemas"
import { updateStripeSettings } from "@/app/actions/settings/payments/stripe/update-settings"
import { PaymentMethodWithConfig, StripeConfigType } from "@/app/admin/settings/payments/types"
import { z } from "zod"
import { toast } from "sonner"
import { PaymentIntent } from "@prisma/client"

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// 👇 Change 1: Import dedicated save bar
import { Stripe_Save_Sticky_Bar } from "./Components/Stripe_Save_Sticky_Bar"

interface AdvancedProps {
  method: PaymentMethodWithConfig
  config: StripeConfigType
}

export const Stripe_Advanced = ({ method, config }: AdvancedProps) => {
  const [isPending, startTransition] = useTransition()

  const form = useForm<z.infer<typeof StripeSettingsSchema>>({
    resolver: zodResolver(StripeSettingsSchema),
    defaultValues: {
      enableStripe: !!method.isEnabled,
      testMode: !!config.testMode,
      title: method.name || "",
      description: method.description || "",
      
      paymentAction: config.paymentAction || PaymentIntent.CAPTURE,
      statementDescriptor: config.statementDescriptor || "",
      shortStatementDescriptor: config.shortStatementDescriptor || "",
      addOrderNumberToStatement: !!config.addOrderNumberToStatement,
      debugLog: !!config.debugLog,
      
      livePublishableKey: config.livePublishableKey || "",
      liveSecretKey: config.liveSecretKey || "",
      liveWebhookSecret: config.liveWebhookSecret || "",
      testPublishableKey: config.testPublishableKey || "",
      testSecretKey: config.testSecretKey || "",
      testWebhookSecret: config.testWebhookSecret || "",
      savedCards: config.savedCards ?? true,
      inlineCreditCardForm: config.inlineCreditCardForm ?? true,
      applePayEnabled: config.applePayEnabled ?? true,
      googlePayEnabled: config.googlePayEnabled ?? true,
      paymentRequestButtons: config.paymentRequestButtons ?? true,
      buttonTheme: config.buttonTheme || "dark",
    }
  })

  const onSubmit = (values: z.infer<typeof StripeSettingsSchema>) => {
    startTransition(() => {
      updateStripeSettings(method.id, values)
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
        <Card>
          <CardHeader>
            <CardTitle>Processing Settings</CardTitle>
            <CardDescription>Control how payments are captured and displayed on bank statements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {/* ... (বাকি ফর্ম ফিল্ডগুলো সেইম থাকবে, তাই লিখলাম না) ... */}
             <FormField
              control={form.control}
              name="paymentAction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Action</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || PaymentIntent.CAPTURE}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CAPTURE">Authorize and Capture</SelectItem>
                      <SelectItem value="AUTHORIZE">Authorize Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose whether to capture the charge immediately or only authorize it.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* ... বাকি কোড সেইম ... */}
            
            <FormField
              control={form.control}
              name="debugLog"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Debug Log</FormLabel>
                    <FormDescription>Log Stripe API events for troubleshooting.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 👇 Change 2: Using dedicated save bar */}
        <Stripe_Save_Sticky_Bar onSave={form.handleSubmit(onSubmit)} isPending={isPending} />
      </form>
    </Form>
  )
}