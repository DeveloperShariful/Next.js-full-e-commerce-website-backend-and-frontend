// app/admin/settings/payments/_components/Stripe/Stripe_Advanced.tsx

"use client"

"use client"

import { useTransition, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { StripeSettingsSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { updateStripeSettings } from "@/app/actions/admin/settings/payments/stripe/update-settings"
import { PaymentMethodWithConfig, StripeConfigType } from "@/app/(admin)/admin/settings/payments/types"
import { verifyApplePayDomain } from "@/app/actions/admin/settings/payments/stripe/verify-apple-pay-domain"
import { z } from "zod"
import { toast } from "sonner"
import { PaymentIntent } from "@prisma/client"

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react"

interface AdvancedProps {
  method: PaymentMethodWithConfig
  config: StripeConfigType
}

// Wallets List
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

// BNPL Options List
const bnplOptions = [
  { 
    id: "klarnaEnabled", 
    label: "Klarna", 
    desc: "Pay in 3 interest-free installments." 
  },
  { 
    id: "afterpayEnabled", 
    label: "Afterpay / Clearpay", 
    desc: "Buy now, pay later in 4 installments." 
  },
  { 
    id: "zipEnabled", 
    label: "Zip Pay", 
    desc: "Flexible repayments for Australian customers." 
  }
] as const

export const Stripe_Advanced = ({ method, config }: AdvancedProps) => {
  const [isPending, startTransition] = useTransition()
  const [verifyingDomain, setVerifyingDomain] = useState(false)

  const form = useForm({
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

      // BNPL Fields
      klarnaEnabled: config.klarnaEnabled ?? true,
      afterpayEnabled: config.afterpayEnabled ?? true,
      zipEnabled: config.zipEnabled ?? true,

      minOrderAmount: method.minOrderAmount ?? null,
      maxOrderAmount: method.maxOrderAmount ?? null,
      surchargeEnabled: method.surchargeEnabled ?? false,
      surchargeType: (method.surchargeType as "fixed" | "percentage" | null) ?? "fixed",
      surchargeAmount: method.surchargeAmount ?? 0,
      taxableSurcharge: method.taxableSurcharge ?? false
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

  const handleDomainVerification = async () => {
    setVerifyingDomain(true)
    try {
        const res = await verifyApplePayDomain(method.id)
        if(res.success) {
          toast.success("Domain verified", { description: res.message })
        } else {
          toast.error("Verification failed", { description: res.error })
        }
    } catch (e) {
        toast.error("Failed to connect to server")
    }
    setVerifyingDomain(false)
  }

  const isApplePayEnabled = form.watch("applePayEnabled")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
        
        {/* Processing Logic */}
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
                      <Input 
                        placeholder="GOBIKESTORE"
                        {...field} 
                        value={field.value ?? ""} 
                        maxLength={22}
                      />
                    </FormControl>
                    <FormDescription>
                      Appears on customer's bank statement (Max 22 chars).
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

        {/* Wallets */}
        <Card>
          <CardHeader>
            <CardTitle>Wallets & Cards</CardTitle>
            <CardDescription>
              Toggle specific card capabilities and digital wallets.
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

            {isApplePayEnabled && (
               <div className="mt-4 p-4 border rounded-md bg-blue-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div className="space-y-1">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                       <CheckCircle2 className="h-4 w-4 text-green-600" /> Apple Pay Domain Verification
                    </h4>
                    <p className="text-xs text-muted-foreground">
                       Stripe requires you to verify your domain to process Apple Pay.
                    </p>
                 </div>
                 <Button 
                   type="button" 
                   size="sm" 
                   variant="outline"
                   onClick={handleDomainVerification}
                   disabled={verifyingDomain}
                 >
                    {verifyingDomain && <Loader2 className="mr-2 h-3 w-3 animate-spin"/>}
                    Verify Domain
                 </Button>
               </div>
            )}
          </CardContent>
        </Card>

        {/* BNPL Section */}
        <Card>
          <CardHeader>
            <CardTitle>Buy Now, Pay Later (BNPL)</CardTitle>
            <CardDescription>
              Offer flexible payment options. These will appear as separate options or within the Stripe element.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bnplOptions.map((option) => (
                <FormField
                  key={option.id}
                  control={form.control}
                  name={option.id as any}
                  render={({ field }) => (
                     <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 bg-white hover:bg-purple-50/50 transition-colors border-l-4 border-l-transparent hover:border-l-purple-500">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-semibold cursor-pointer">
                          {option.label}
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          {option.desc}
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded-md border border-yellow-100 flex items-start gap-2">
               <AlertTriangle className="h-4 w-4 shrink-0" />
               <span>
                  <strong>Important:</strong> Ensure these payment methods are also enabled in your 
                  <a href="https://dashboard.stripe.com/settings/payment_methods" target="_blank" className="underline font-bold ml-1">Stripe Dashboard</a>.
               </span>
            </div>
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