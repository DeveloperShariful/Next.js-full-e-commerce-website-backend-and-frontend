// app/admin/settings/payments/_components/Payment_Gateways/Stripe/Stripe_General_Form.tsx
"use client"

import { useTransition, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { StripeSettingsSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { updateStripeSettings } from "@/app/actions/admin/settings/payments/stripe/update-settings"
import { PaymentMethodWithConfig, StripeConfigType } from "@/app/(admin)/admin/settings/payments/types"
import { z } from "zod"
import { toast } from "sonner"
import { PaymentIntent } from "@prisma/client"

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Stripe_Save_Sticky_Bar } from "./Components/Stripe_Save_Sticky_Bar"
import { Eye, EyeOff, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GeneralFormProps {
  method: PaymentMethodWithConfig
  config: StripeConfigType
}

export const Stripe_General_Form = ({ method, config }: GeneralFormProps) => {
  const [isPending, startTransition] = useTransition()
  const [showSecret, setShowSecret] = useState(false)

  const form = useForm<z.infer<typeof StripeSettingsSchema>>({
    resolver: zodResolver(StripeSettingsSchema),
    defaultValues: {
      enableStripe: !!method.isEnabled,
      testMode: !!config.testMode,
      title: method.name || "Credit Card / Debit Card",
      // 👇 Fix: Fallback to empty string if null
      description: method.description || "",
      
      livePublishableKey: config.livePublishableKey || "",
      liveSecretKey: config.liveSecretKey || "",
      liveWebhookSecret: config.liveWebhookSecret || "",
      testPublishableKey: config.testPublishableKey || "",
      testSecretKey: config.testSecretKey || "",
      testWebhookSecret: config.testWebhookSecret || "",
      
      paymentAction: config.paymentAction || PaymentIntent.CAPTURE,
      statementDescriptor: config.statementDescriptor || "",
      shortStatementDescriptor: config.shortStatementDescriptor || "",
      addOrderNumberToStatement: !!config.addOrderNumberToStatement,
      savedCards: config.savedCards ?? true,
      inlineCreditCardForm: config.inlineCreditCardForm ?? true,
      applePayEnabled: config.applePayEnabled ?? true,
      googlePayEnabled: config.googlePayEnabled ?? true,
      paymentRequestButtons: config.paymentRequestButtons ?? true,
      buttonTheme: config.buttonTheme || "dark",
      debugLog: !!config.debugLog,
    }
  })

  const isTestMode = form.watch("testMode");

  const onSubmit = (values: z.infer<typeof StripeSettingsSchema>) => {
    startTransition(() => {
      updateStripeSettings(method.id, values)
        .then((data) => {
          if (data.success) {
            toast.success("Stripe settings saved")
          } else {
            toast.error(data.error)
          }
        })
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
        
        {/* Status Card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <FormField
              control={form.control}
              name="enableStripe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Stripe</FormLabel>
                    <FormDescription>
                      Accept credit card payments on checkout.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="testMode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-yellow-50/50 border-yellow-100">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-yellow-900">Test Mode</FormLabel>
                    <FormDescription className="text-yellow-700">
                      Use test keys to simulate transactions without real money.
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

        {/* API Credentials Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[#635BFF]" />
              <CardTitle>API Credentials</CardTitle>
            </div>
            <CardDescription>
              Enter your {isTestMode ? "Test" : "Live"} API keys from the Stripe Dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTestMode ? (
              <>
                <FormField
                  control={form.control}
                  name="testPublishableKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Publishable Key</FormLabel>
                      <FormControl>
                        {/* 👇 FIX: Added value={field.value ?? ""} */}
                        <Input {...field} value={field.value ?? ""} placeholder="pk_test_..." className="font-mono" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="testSecretKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Secret Key</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          {/* 👇 FIX: Added value={field.value ?? ""} */}
                          <Input 
                            {...field} 
                            value={field.value ?? ""}
                            type={showSecret ? "text" : "password"} 
                            placeholder="sk_test_..." 
                            className="font-mono" 
                          />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          onClick={() => setShowSecret(!showSecret)}
                        >
                          {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <FormDescription>
                        Starts with <code>sk_test_</code>. Keep this secret.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="livePublishableKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Live Publishable Key</FormLabel>
                      <FormControl>
                        {/* 👇 FIX: Added value={field.value ?? ""} */}
                        <Input {...field} value={field.value ?? ""} placeholder="pk_live_..." className="font-mono" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="liveSecretKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Live Secret Key</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          {/* 👇 FIX: Added value={field.value ?? ""} */}
                          <Input 
                            {...field} 
                            value={field.value ?? ""}
                            type={showSecret ? "text" : "password"} 
                            placeholder="sk_live_..." 
                            className="font-mono" 
                          />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          onClick={() => setShowSecret(!showSecret)}
                        >
                          {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <FormDescription>
                        Starts with <code>sk_live_</code>. Never share this key.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    {/* 👇 FIX: Added value={field.value ?? ""} */}
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>Payment method name shown to customers.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    {/* 👇 FIX: Added value={field.value ?? ""} */}
                    <Textarea {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>Payment method description shown to customers.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Stripe_Save_Sticky_Bar onSave={form.handleSubmit(onSubmit)} isPending={isPending} />
      </form>
    </Form>
  )
}