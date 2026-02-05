// app/admin/settings/payments/_components/Cheque_Modal.tsx

"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { ChequeSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { updateChequeSettings } from "@/app/actions/admin/settings/payments/offline-payment-method"
import { z } from "zod"
import { toast } from "sonner"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Payment_Limits_Surcharge } from "./Payment_Limits_Surcharge"

interface ChequeFormProps {
  methodId: string
  config: any
  offlineConfig: any
}

export const Cheque_Form = ({ methodId, config, offlineConfig }: ChequeFormProps) => {
  const [isPending, startTransition] = useTransition()

  const form = useForm({
    defaultValues: {
      name: config.name || "Cheque Payment",
      description: config.description || "",
      instructions: config.instructions || "",
      isEnabled: !!config.isEnabled,
      chequePayTo: offlineConfig?.chequePayTo || "",
      addressInfo: offlineConfig?.addressInfo || "",

      minOrderAmount: config.minOrderAmount ?? null,
      maxOrderAmount: config.maxOrderAmount ?? null,
      surchargeEnabled: config.surchargeEnabled ?? false,
      surchargeType: (config.surchargeType as "fixed" | "percentage" | null) ?? "fixed",
      surchargeAmount: config.surchargeAmount ?? 0,
      taxableSurcharge: config.taxableSurcharge ?? false
    }
  })

  const onSubmit = (values: z.infer<typeof ChequeSchema>) => {
    startTransition(() => {
      updateChequeSettings(methodId, values)
        .then((data) => {
          if (data.success) {
            toast.success("Cheque settings updated")
          } else {
            toast.error(data.error)
          }
        })
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
        <div className="grid gap-6 bg-white p-6 border rounded-lg shadow-sm">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="chequePayTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay To (Name)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="e.g. My Company Ltd" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="addressInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Send To (Address)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Street, City, Zip" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Added to the Order Received page and emails." />
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