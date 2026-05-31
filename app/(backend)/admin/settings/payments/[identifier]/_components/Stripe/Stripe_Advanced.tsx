//File 12: app/admin/settings/payments/[identifier]/_components/Stripe/Stripe_Advanced.tsx

"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { PaymentGatewayUI, StripeSettingsSchema, SharedGatewaySchema, StripeSettingsType } from "@/app/(backend)/admin/settings/payments/types-and-schemas"
import { updateStripeSettings } from "@/app/actions/backend/settings/payments/stripe-actions"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export const Stripe_Advanced = ({ method }: { method: PaymentGatewayUI }) => {
  const [isPending, startTransition] = useTransition()
  
  const settings = (method.settings || {}) as StripeSettingsType;

  const form = useForm({
    resolver: zodResolver(z.object({
      shared: SharedGatewaySchema,
      settings: StripeSettingsSchema
    })),
    defaultValues: {
      shared: {
        name: method.name,
        title: method.title,
        description: method.description || "",
        isEnabled: method.isEnabled,
        mode: method.mode,
        minOrderAmount: method.minOrderAmount,
        maxOrderAmount: method.maxOrderAmount,
        surchargeEnabled: method.surchargeEnabled,
        surchargeAmount: method.surchargeAmount
      },
      settings: {
        paymentAction: settings.paymentAction || "CAPTURE",
        statementDescriptor: settings.statementDescriptor || "",
        shortStatementDescriptor: settings.shortStatementDescriptor || "",
        addOrderNumberToStatement: settings.addOrderNumberToStatement || false,
        savedCards: settings.savedCards ?? true,
        inlineCreditCardForm: settings.inlineCreditCardForm ?? true,
        applePayEnabled: settings.applePayEnabled ?? true,
        googlePayEnabled: settings.googlePayEnabled ?? true,
        paymentRequestButtons: settings.paymentRequestButtons ?? true,
        klarnaEnabled: settings.klarnaEnabled ?? false,
        afterpayEnabled: settings.afterpayEnabled ?? false,
        zipEnabled: settings.zipEnabled ?? false,
        buttonTheme: settings.buttonTheme || "dark",
        debugLog: settings.debugLog || false
      }
    }
  })

  const onSubmit = (values: any) => {
    startTransition(() => {
      updateStripeSettings(method.id, values.shared, values.settings)
        .then((data) => {
          if (data.success) toast.success("Advanced settings saved");
          else toast.error(data.error);
        })
    })
  }

  // WooCommerce Table Row Helper
  const FormRow = ({ label, children, isLast = false }: { label: string, children: React.ReactNode, isLast?: boolean }) => (
    <div className={`flex flex-col md:flex-row py-5 px-6 ${!isLast ? 'border-b border-gray-200' : ''}`}>
      <div className="w-full md:w-1/3 mb-2 md:mb-0 text-sm font-semibold text-gray-700">{label}</div>
      <div className="w-full md:w-2/3">{children}</div>
    </div>
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        
        {/* Processing Section */}
        <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-200 font-semibold text-gray-800">Payment Processing</div>
        
        <FormRow label="Transaction Type">
          <FormField control={form.control} name="settings.paymentAction" render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="max-w-md bg-white border-gray-300 h-9"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="CAPTURE">Authorize and Capture</SelectItem>
                  <SelectItem value="AUTHORIZE">Authorize Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1.5">Capture instantly deducts money. Authorize holds the funds to be captured later.</p>
            </FormItem>
          )} />
        </FormRow>

        <FormRow label="Statement Descriptor">
          <FormField control={form.control} name="settings.statementDescriptor" render={({ field }) => (
            <FormItem>
              <FormControl><Input {...field} value={field.value || ""} className="max-w-md bg-white border-gray-300 h-9" maxLength={22} placeholder="STORENAME" /></FormControl>
              <p className="text-xs text-gray-500 mt-1.5">This appears on your customer's bank statement (Max 22 chars).</p>
            </FormItem>
          )} />
        </FormRow>

        <FormRow label="Saved Cards">
          <FormField control={form.control} name="settings.savedCards" render={({ field }) => (
            <FormItem className="flex items-start space-x-2 space-y-0">
              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
              <label className="text-sm font-normal text-gray-700 cursor-pointer">Enable Payment via Saved Cards</label>
            </FormItem>
          )} />
        </FormRow>

        {/* Express Checkouts */}
        <div className="bg-gray-50/50 px-6 py-3 border-y border-gray-200 font-semibold text-gray-800 mt-4">Express Checkouts (Wallets)</div>

        <FormRow label="Apple Pay / Google Pay">
          <div className="space-y-3">
            <FormField control={form.control} name="settings.applePayEnabled" render={({ field }) => (
              <FormItem className="flex items-start space-x-2 space-y-0">
                <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                <label className="text-sm font-normal text-gray-700 cursor-pointer">Enable Apple Pay</label>
              </FormItem>
            )} />
            <FormField control={form.control} name="settings.googlePayEnabled" render={({ field }) => (
              <FormItem className="flex items-start space-x-2 space-y-0">
                <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                <label className="text-sm font-normal text-gray-700 cursor-pointer">Enable Google Pay</label>
              </FormItem>
            )} />
          </div>
        </FormRow>

        {/* BNPL Options */}
        <div className="bg-gray-50/50 px-6 py-3 border-y border-gray-200 font-semibold text-gray-800 mt-4">Buy Now, Pay Later (BNPL)</div>

        <FormRow label="Supported BNPL Methods" isLast>
          <div className="space-y-3">
            <FormField control={form.control} name="settings.afterpayEnabled" render={({ field }) => (
              <FormItem className="flex items-start space-x-2 space-y-0">
                <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="leading-none">
                  <label className="text-sm font-normal text-gray-700 cursor-pointer">Afterpay / Clearpay</label>
                  <p className="text-xs text-gray-500 mt-1">Make sure it is activated in your Stripe Dashboard.</p>
                </div>
              </FormItem>
            )} />
            <FormField control={form.control} name="settings.klarnaEnabled" render={({ field }) => (
              <FormItem className="flex items-start space-x-2 space-y-0">
                <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                <label className="text-sm font-normal text-gray-700 cursor-pointer">Klarna</label>
              </FormItem>
            )} />
            <FormField control={form.control} name="settings.zipEnabled" render={({ field }) => (
              <FormItem className="flex items-start space-x-2 space-y-0">
                <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                <label className="text-sm font-normal text-gray-700 cursor-pointer">Zip Pay</label>
              </FormItem>
            )} />
          </div>
        </FormRow>

        {/* Action Button */}
        <div className="bg-gray-50 p-4 border-t border-gray-300 flex justify-end rounded-b-sm">
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-6 text-sm">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
            </Button>
        </div>
      </form>
    </Form>
  )
}