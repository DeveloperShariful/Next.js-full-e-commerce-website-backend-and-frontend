//File 9: app/admin/settings/payments/[identifier]/_components/Stripe/Stripe_General_Form.tsx

"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SharedGatewaySchema, StripeSettingsSchema, PaymentGatewayUI, StripeSettingsType } from "@/app/(backend)/admin/settings/payments/types-and-schemas"
import { updateStripeSettings } from "@/app/actions/backend/settings/payments/stripe-actions"
import { z } from "zod"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// 1. Define Schema
const FormSchema = z.object({
  shared: SharedGatewaySchema,
  settings: StripeSettingsSchema
})

// 2. Extract Zod Input and Output Types for React Hook Form
type FormInput = z.input<typeof FormSchema>
type FormOutput = z.output<typeof FormSchema>

export const Stripe_General_Form = ({ method }: { method: PaymentGatewayUI }) => {
  const [isPending, startTransition] = useTransition()
  const settings = (method.settings || {}) as StripeSettingsType;

  // 3. 100% Strict Typed useForm (Input Type, Context, Output Type)
  const form = useForm<FormInput, undefined, FormOutput>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      shared: {
        name: method.name,
        title: method.title,
        description: method.description || "",
        isEnabled: method.isEnabled,
        mode: method.mode,
        minOrderAmount: method.minOrderAmount ?? null,
        maxOrderAmount: method.maxOrderAmount ?? null,
        surchargeEnabled: method.surchargeEnabled,
        surchargeAmount: method.surchargeAmount ?? 0
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

  // 4. onSubmit receives strictly validated Output type
  const onSubmit = (values: FormOutput) => {
    startTransition(() => {
      updateStripeSettings(method.id, values.shared, values.settings)
        .then((data) => {
          if (data.success) toast.success("Settings saved successfully");
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
        
        <FormRow label="Enable/Disable">
          <FormField control={form.control} name="shared.isEnabled" render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
              <label className="text-sm font-normal text-gray-700 cursor-pointer">Enable this payment method</label>
            </FormItem>
          )} />
        </FormRow>

        <FormRow label="Test Mode">
          <FormField control={form.control} name="shared.mode" render={({ field }) => (
            <FormItem className="flex items-start space-x-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value === "TEST"} onCheckedChange={(c) => field.onChange(c ? "TEST" : "LIVE")} />
              </FormControl>
              <div className="leading-none">
                <label className="text-sm font-normal text-gray-700 cursor-pointer">Enable Test Mode</label>
                <p className="text-xs text-gray-500 mt-1">Use Stripe test keys to simulate transactions without real money.</p>
              </div>
            </FormItem>
          )} />
        </FormRow>

        <FormRow label="Title">
          <FormField control={form.control} name="shared.title" render={({ field }) => (
            <FormItem>
              <FormControl><Input {...field} value={field.value ?? ""} className="max-w-md bg-white border-gray-300 h-9" /></FormControl>
              <p className="text-xs text-gray-500 mt-1.5">This controls the title which the user sees during checkout.</p>
              <FormMessage />
            </FormItem>
          )} />
        </FormRow>

        <FormRow label="Description">
          <FormField control={form.control} name="shared.description" render={({ field }) => (
            <FormItem>
              <FormControl><Textarea {...field} value={field.value ?? ""} className="max-w-md bg-white border-gray-300 min-h-[80px]" /></FormControl>
              <p className="text-xs text-gray-500 mt-1.5">This controls the description which the user sees during checkout.</p>
              <FormMessage />
            </FormItem>
          )} />
        </FormRow>

        <FormRow label="Minimum Order Amount" isLast>
          <FormField control={form.control} name="shared.minOrderAmount" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input 
                  type="number" 
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  disabled={field.disabled}
                  value={(field.value as number | null | undefined) ?? ""} 
                  onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} 
                  className="max-w-[200px] bg-white border-gray-300 h-9" 
                  placeholder="0.00" 
                />
              </FormControl>
              <p className="text-xs text-gray-500 mt-1.5">Hide this method if cart total is less than this amount.</p>
              <FormMessage />
            </FormItem>
          )} />
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