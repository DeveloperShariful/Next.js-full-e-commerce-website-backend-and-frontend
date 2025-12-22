// app/admin/settings/payments/_components/Payment_Gateways/Paypal/Paypal_General_Form.tsx
"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PaypalSettingsSchema } from "@/app/admin/settings/payments/schemas"
import { updatePaypalSettings } from "@/app/actions/settings/payments/paypal/update-settings"
import { PaymentMethodWithConfig, PaypalConfigType } from "@/app/admin/settings/payments/types"
import { z } from "zod"
import { toast } from "sonner"
import { PaymentIntent, PayPalLandingPage } from "@prisma/client"

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"

// Custom Components
import { Paypal_Save_Sticky_Bar } from "./Components/Paypal_Save_Sticky_Bar"

interface GeneralFormProps {
  method: PaymentMethodWithConfig
  config: PaypalConfigType
}

export const Paypal_General_Form = ({ method, config }: GeneralFormProps) => {
  const [isPending, startTransition] = useTransition()

  const form = useForm<z.infer<typeof PaypalSettingsSchema>>({
    resolver: zodResolver(PaypalSettingsSchema),
    defaultValues: {
      isEnabled: method.isEnabled, // 👈 NEW: Initial value from parent
      sandbox: !!config.sandbox,
      title: method.name || "PayPal",
      description: method.description || "",
      brandName: config.brandName || "",
      intent: config.intent || PaymentIntent.CAPTURE,
      landingPage: config.landingPage || PayPalLandingPage.LOGIN,
      instantPayments: !!config.instantPayments,
      
      // Pass through other required fields to satisfy schema
      liveEmail: config.liveEmail || "",
      liveClientId: config.liveClientId || "",
      liveClientSecret: config.liveClientSecret || "",
      sandboxEmail: config.sandboxEmail || "",
      sandboxClientId: config.sandboxClientId || "",
      sandboxClientSecret: config.sandboxClientSecret || "",
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
      invoicePrefix: config.invoicePrefix || "",
      debugLog: !!config.debugLog,
    }
  })

  const onSubmit = (values: z.infer<typeof PaypalSettingsSchema>) => {
    startTransition(() => {
      updatePaypalSettings(method.id, values)
        .then((data) => {
          if (data.success) {
            toast.success("PayPal settings saved")
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
          <CardContent className="pt-6 space-y-4">
            
            {/* 1. ENABLE / DISABLE SWITCH (NEW) */}
            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable PayPal</FormLabel>
                    <FormDescription>
                      Show PayPal as a payment option at checkout.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* 2. SANDBOX SWITCH */}
            <FormField
              control={form.control}
              name="sandbox"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-yellow-50/50 border-yellow-100">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-yellow-900">Sandbox Mode</FormLabel>
                    <FormDescription className="text-yellow-700">
                      Enable to test payments using PayPal Sandbox without real money.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* 3. TITLE & DESCRIPTION */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method Title</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>User sees this title at checkout.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="brandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Your Store Name" />
                    </FormControl>
                     <FormDescription>Overrides business name on PayPal page.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>Short description displayed to customer.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

          </CardContent>
        </Card>

        <Paypal_Save_Sticky_Bar onSave={form.handleSubmit(onSubmit)} isPending={isPending} />
      </form>
    </Form>
  )
}