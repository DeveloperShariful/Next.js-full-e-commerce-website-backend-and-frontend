// app/admin/settings/payments/_components/COD_Modal.tsx

"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { CodSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { updateCodSettings } from "@/app/actions/admin/settings/payments/offline-payment-method"
import { z } from "zod"
import { toast } from "sonner"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Payment_Limits_Surcharge } from "./Payment_Limits_Surcharge"

interface CodFormProps {
  methodId: string
  config: any
  offlineConfig: any
}

export const COD_Form = ({ methodId, config, offlineConfig }: CodFormProps) => {
  const [isPending, startTransition] = useTransition()

  const form = useForm({
    defaultValues: {
      name: config.name || "Cash on Delivery",
      description: config.description || "",
      instructions: config.instructions || "",
      isEnabled: !!config.isEnabled,
      enableForShippingMethods: offlineConfig?.enableForShippingMethods || [],

      minOrderAmount: config.minOrderAmount ?? null,
      maxOrderAmount: config.maxOrderAmount ?? null,
      surchargeEnabled: config.surchargeEnabled ?? false,
      surchargeType: (config.surchargeType as "fixed" | "percentage" | null) ?? "fixed",
      surchargeAmount: config.surchargeAmount ?? 0,
      taxableSurcharge: config.taxableSurcharge ?? false
    }
  })

  const onSubmit = (values: z.infer<typeof CodSchema>) => {
    startTransition(() => {
      updateCodSettings(methodId, values)
        .then((data) => {
          if (data.success) {
            toast.success("COD settings updated")
          } else {
            toast.error(data.error)
          }
        })
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
        <div className="grid gap-4 bg-white p-6 border rounded-lg shadow-sm">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method Title</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
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
                    <Textarea {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Pay with cash upon delivery." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <Payment_Limits_Surcharge form={form} />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </form>
    </Form>
  )
}