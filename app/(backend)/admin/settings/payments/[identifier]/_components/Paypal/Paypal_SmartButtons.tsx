//File 15: app/admin/settings/payments/[identifier]/_components/Paypal/Paypal_SmartButtons.tsx

"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { 
  SharedGatewaySchema, 
  PaypalSettingsSchema, 
  PaymentGatewayUI, 
  PaypalSettingsType 
} from "@/app/(backend)/admin/settings/payments/types-and-schemas"
import { updatePaypalSettings } from "@/app/actions/backend/settings/payments/paypal-actions"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

const FormSchema = z.object({
  shared: SharedGatewaySchema,
  settings: PaypalSettingsSchema
})

type FormInput = z.input<typeof FormSchema>
type FormOutput = z.output<typeof FormSchema>

export const Paypal_SmartButtons = ({ method }: { method: PaymentGatewayUI }) => {
  const [isPending, startTransition] = useTransition()
  
  const settings = (method.settings || {}) as PaypalSettingsType;

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
        intent: settings.intent || "CAPTURE",
        instantPayments: settings.instantPayments || false,
        brandName: settings.brandName || "",
        landingPage: settings.landingPage || "LOGIN",
        disableFunding: settings.disableFunding || [],
        advancedCardEnabled: settings.advancedCardEnabled || false,
        advancedCardTitle: settings.advancedCardTitle || "Debit & Credit Cards",
        vaultingEnabled: settings.vaultingEnabled || false,
        smartButtonLocations: settings.smartButtonLocations || ["checkout", "cart"],
        requireFinalConfirmation: settings.requireFinalConfirmation ?? true,
        buttonLabel: settings.buttonLabel || "PAYPAL",
        buttonLayout: settings.buttonLayout || "VERTICAL",
        buttonColor: settings.buttonColor || "GOLD",
        buttonShape: settings.buttonShape || "RECT",
        payLaterEnabled: settings.payLaterEnabled ?? true,
        payLaterLocations: settings.payLaterLocations || [],
        payLaterMessaging: settings.payLaterMessaging ?? true,
        payLaterMessageTheme: settings.payLaterMessageTheme || "light",
        invoicePrefix: settings.invoicePrefix || "WC-",
        debugLog: settings.debugLog || false
      }
    }
  })

  const onSubmit = (values: FormOutput) => {
    startTransition(() => {
      updatePaypalSettings(method.id, values.shared, values.settings)
        .then((data) => {
          if (data.success) toast.success("Smart Button settings saved")
          else toast.error(data.error)
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
        
        <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-200 font-semibold text-gray-800">Button Appearance</div>

        <FormRow label="Button Color">
          <FormField control={form.control} name="settings.buttonColor" render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="max-w-md bg-white border-gray-300 h-9"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="GOLD">Gold (Recommended)</SelectItem>
                  <SelectItem value="BLUE">Blue</SelectItem>
                  <SelectItem value="SILVER">Silver</SelectItem>
                  <SelectItem value="BLACK">Black</SelectItem>
                  <SelectItem value="WHITE">White</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </FormRow>

        <FormRow label="Button Shape">
          <FormField control={form.control} name="settings.buttonShape" render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="max-w-md bg-white border-gray-300 h-9"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="RECT">Rectangle</SelectItem>
                  <SelectItem value="PILL">Pill</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </FormRow>

        <FormRow label="Button Label">
          <FormField control={form.control} name="settings.buttonLabel" render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="max-w-md bg-white border-gray-300 h-9"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="PAYPAL">PayPal</SelectItem>
                  <SelectItem value="CHECKOUT">Checkout</SelectItem>
                  <SelectItem value="BUYNOW">Buy Now</SelectItem>
                  <SelectItem value="PAY">Pay</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </FormRow>

        <div className="bg-gray-50/50 px-6 py-3 border-y border-gray-200 font-semibold text-gray-800 mt-4">Pay Later Messaging</div>

        <FormRow label="Pay Later Button">
          <FormField control={form.control} name="settings.payLaterEnabled" render={({ field }) => (
            <FormItem className="flex items-start space-x-2 space-y-0">
              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
              <div className="leading-none">
                <label className="text-sm font-normal text-gray-700 cursor-pointer">Enable Pay Later Checkout Button</label>
                <p className="text-xs text-gray-500 mt-1">Allows customers to pay in installments via PayPal Credit.</p>
              </div>
            </FormItem>
          )} />
        </FormRow>

        <FormRow label="Installment Messages" isLast>
          <FormField control={form.control} name="settings.payLaterMessaging" render={({ field }) => (
            <FormItem className="flex items-start space-x-2 space-y-0">
              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
              <div className="leading-none">
                <label className="text-sm font-normal text-gray-700 cursor-pointer">Show "Pay in 4" Messages</label>
                <p className="text-xs text-gray-500 mt-1">Displays installment calculations near product prices.</p>
              </div>
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