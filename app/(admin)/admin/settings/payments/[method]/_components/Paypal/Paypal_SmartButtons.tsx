// app/admin/settings/payments/_components/Paypal/Paypal_SmartButtons.tsx

"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PaypalSettingsSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { updatePaypalSettings } from "@/app/actions/admin/settings/payments/paypal/update-settings"
import { PaymentMethodWithConfig, PaypalConfigType } from "@/app/(admin)/admin/settings/payments/types"
import { z } from "zod"
import { toast } from "sonner"
import { PayPalButtonColor, PayPalButtonLabel, PayPalButtonLayout, PayPalButtonShape } from "@prisma/client"
import { Loader2 } from "lucide-react"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

interface SmartButtonsProps {
  method: PaymentMethodWithConfig
  config: PaypalConfigType
}

const locations = [
  { id: "checkout", label: "Checkout Page" },
  { id: "cart", label: "Cart Page" },
  { id: "product", label: "Product Details Page" },
  { id: "ministore", label: "Mini Cart / Drawer" },
] as const

const fundingSources = [
  { id: "CREDIT", label: "PayPal Credit (Pay Later)", desc: "Allow customers to pay with PayPal Credit." },
  { id: "CARD", label: "Credit/Debit Cards", desc: "Allow guest checkout with Visa, Mastercard, etc." },
  { id: "VENMO", label: "Venmo", desc: "Popular in US." },
  { id: "BANCONTACT", label: "Bancontact", desc: "Popular in Belgium." },
  { id: "EPS", label: "EPS", desc: "Popular in Austria." },
  { id: "GIROPAY", label: "Giropay", desc: "Popular in Germany." },
  { id: "IDEAL", label: "iDEAL", desc: "Popular in Netherlands." },
  { id: "MYBANK", label: "MyBank", desc: "Popular in Italy." },
  { id: "SOFORT", label: "Sofort", desc: "Popular in Europe." },
  { id: "SEPA", label: "SEPA Direct Debit", desc: "European Bank Transfer." },
] as const

export const Paypal_SmartButtons = ({ method, config }: SmartButtonsProps) => {
  const [isPending, startTransition] = useTransition()

  const form = useForm({
    resolver: zodResolver(PaypalSettingsSchema),
    defaultValues: {
      buttonLabel: config.buttonLabel || PayPalButtonLabel.PAYPAL,
      buttonLayout: config.buttonLayout || PayPalButtonLayout.VERTICAL,
      buttonColor: config.buttonColor || PayPalButtonColor.GOLD,
      buttonShape: config.buttonShape || PayPalButtonShape.RECT,
      smartButtonLocations: config.smartButtonLocations || [],
      disableFunding: config.disableFunding || [], 
      requireFinalConfirmation: config.requireFinalConfirmation ?? true,
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
      advancedCardEnabled: !!config.advancedCardEnabled,
      advancedCardTitle: config.advancedCardTitle || "",
      vaultingEnabled: !!config.vaultingEnabled,
      payLaterEnabled: config.payLaterEnabled ?? true,
      payLaterLocations: config.payLaterLocations || [],
      payLaterMessaging: config.payLaterMessaging ?? true,
      payLaterMessageTheme: config.payLaterMessageTheme || "light",
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
            toast.success("Button settings updated")
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
            <CardTitle>Button Appearance</CardTitle>
            <CardDescription>Customize the look and feel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="buttonColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="GOLD">Gold</SelectItem>
                          <SelectItem value="BLUE">Blue</SelectItem>
                          <SelectItem value="SILVER">Silver</SelectItem>
                          <SelectItem value="WHITE">White</SelectItem>
                          <SelectItem value="BLACK">Black</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                 <FormField
                  control={form.control}
                  name="buttonShape"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shape</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="RECT">Rectangle</SelectItem>
                          <SelectItem value="PILL">Pill</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="buttonLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="PAYPAL">PayPal</SelectItem>
                          <SelectItem value="CHECKOUT">Checkout</SelectItem>
                          <SelectItem value="BUYNOW">Buy Now</SelectItem>
                          <SelectItem value="PAY">Pay</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="buttonLayout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Layout</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="VERTICAL">Vertical</SelectItem>
                          <SelectItem value="HORIZONTAL">Horizontal</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods (Funding Sources)</CardTitle>
            <CardDescription>
              Control which payment options are available inside the PayPal Smart Button.
              <br/>
              <span className="text-xs text-muted-foreground">
                Note: PayPal automatically hides methods not supported in the customer's country. You can force disable them here.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full bg-muted/20 rounded-md border px-4">
              <AccordionItem value="item-1" className="border-b-0">
                <AccordionTrigger className="hover:no-underline py-3">
                   Manage Supported Methods
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {fundingSources.map((source) => (
                      <FormField
                        key={source.id}
                        control={form.control}
                        name="disableFunding"
                        render={({ field }) => {
                          const isEnabled = !field.value?.includes(source.id)
                          
                          return (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 bg-white">
                              <FormControl>
                                <Checkbox
                                  checked={isEnabled}
                                  onCheckedChange={(checked) => {
                                    const currentDisabled = field.value || []
                                    if (checked) {
                                      field.onChange(currentDisabled.filter((id) => id !== source.id))
                                    } else {
                                      field.onChange([...currentDisabled, source.id])
                                    }
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-semibold cursor-pointer">
                                  {source.label}
                                </FormLabel>
                                <FormDescription className="text-xs">
                                  {source.desc}
                                </FormDescription>
                              </div>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* === SECTION 3: DISPLAY LOCATIONS === */}
        <Card>
          <CardHeader>
            <CardTitle>Display Locations</CardTitle>
            <CardDescription>Where should the PayPal Smart Buttons appear?</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {locations.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="smartButtonLocations"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), item.id])
                                : field.onChange(field.value?.filter((val) => val !== item.id))
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
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