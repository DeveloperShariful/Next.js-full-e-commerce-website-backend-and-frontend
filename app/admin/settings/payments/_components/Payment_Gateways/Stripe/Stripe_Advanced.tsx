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
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox" // 👈 Checkbox Import
import { Stripe_Save_Sticky_Bar } from "./Components/Stripe_Save_Sticky_Bar"

interface AdvancedProps {
  method: PaymentMethodWithConfig
  config: StripeConfigType
}

// 👇 Payment Features List
const paymentFeatures = [
  { 
    id: "savedCards", 
    label: "Saved Cards", 
    desc: "Allow customers to save cards for future purchases." 
  },
  { 
    id: "applePayEnabled", 
    label: "Apple Pay", 
    desc: "Enable one-click checkout for Apple devices." 
  },
  { 
    id: "googlePayEnabled", 
    label: "Google Pay", 
    desc: "Enable fast checkout for Android/Chrome users." 
  },
  { 
    id: "paymentRequestButtons", 
    label: "Payment Request Button", 
    desc: "Show dynamic 'Pay Now' buttons (Apple/Google Pay) on top of checkout." 
  },
  { 
    id: "inlineCreditCardForm", 
    label: "Inline Card Form", 
    desc: "Display card inputs directly on the page instead of a modal." 
  }
] as const

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
      
      // Feature Flags
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
        
        {/* 1. Payment Action Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Logic</CardTitle>
            <CardDescription>Control how payments are captured and handled.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                       "Capture" charges immediately. "Authorize" holds funds for later.
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="statementDescriptor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statement Descriptor</FormLabel>
                    <FormControl>
                      <input 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="GOBIKESTORE"
                        {...field} 
                        value={field.value ?? ""} 
                        maxLength={22}
                      />
                    </FormControl>
                    <FormDescription>
                      This text will appear on your customer's bank statement (Max 22 chars).
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
            
             <FormField
                control={form.control}
                name="debugLog"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-slate-50">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Debug Log</FormLabel>
                      <FormDescription>Save Stripe API responses to system logs for troubleshooting.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
          </CardContent>
        </Card>

        {/* 2. Payment Features (APM Control) */}
        <Card>
          <CardHeader>
            <CardTitle>Wallets & Features</CardTitle>
            <CardDescription>
              Toggle specific payment capabilities and wallets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentFeatures.map((feature) => (
                <FormField
                  key={feature.id}
                  control={form.control}
                  name={feature.id as any}
                  render={({ field }) => (
                     <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 bg-white hover:bg-gray-50 transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-semibold cursor-pointer">
                          {feature.label}
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          {feature.desc}
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-md border border-blue-100">
               <strong>Note:</strong> Other local payment methods (iDEAL, Klarna, Alipay) are managed automatically by Stripe based on your Dashboard settings and customer location.
            </div>
          </CardContent>
        </Card>

        <Stripe_Save_Sticky_Bar onSave={form.handleSubmit(onSubmit)} isPending={isPending} />
      </form>
    </Form>
  )
}