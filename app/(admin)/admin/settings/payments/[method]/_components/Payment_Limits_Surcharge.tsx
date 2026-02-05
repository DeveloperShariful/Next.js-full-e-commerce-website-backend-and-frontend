// app/admin/settings/payments/_components/Payment_Limits_Surcharge.tsx

"use client"

import { UseFormReturn } from "react-hook-form"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator } from "lucide-react"
import { useEffect, useState } from "react"

interface Props {
  form: UseFormReturn<any>
}

export const Payment_Limits_Surcharge = ({ form }: Props) => {
  const [previewCost, setPreviewCost] = useState(0)
  
  const surchargeType = form.watch("surchargeType")
  const surchargeAmount = form.watch("surchargeAmount") || 0
  const isEnabled = form.watch("surchargeEnabled")

  useEffect(() => {
    const baseAmount = 100
    if (surchargeType === "percentage") {
      setPreviewCost(baseAmount + (baseAmount * (surchargeAmount / 100)))
    } else {
      setPreviewCost(baseAmount + Number(surchargeAmount))
    }
  }, [surchargeType, surchargeAmount])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Limits</CardTitle>
          <CardDescription>Restrict this payment method based on order total.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minOrderAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Order Amount</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value ?? ""} placeholder="0.00" />
                </FormControl>
                <FormDescription>Leave empty for no minimum.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxOrderAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Order Amount</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value ?? ""} placeholder="No limit" />
                </FormControl>
                <FormDescription>Leave empty for no maximum.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Surcharge / Extra Fee</CardTitle>
          <CardDescription>Charge an additional fee for using this payment method.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="surchargeEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Enable Surcharge</FormLabel>
                  <FormDescription>Add extra fee to checkout total.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {isEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
              <FormField
                control={form.control}
                name="surchargeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="surchargeAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Amount</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ""} placeholder="0.00" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="col-span-1 md:col-span-2 bg-muted/50 p-4 rounded-md border flex items-center gap-3 text-sm text-muted-foreground mt-2">
                <Calculator className="h-4 w-4" />
                <span>
                  <strong>Preview:</strong> For a $100.00 order, customer pays <strong>${previewCost.toFixed(2)}</strong>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}