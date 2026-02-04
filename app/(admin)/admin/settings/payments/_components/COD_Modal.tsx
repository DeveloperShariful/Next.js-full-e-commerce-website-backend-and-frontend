// app/admin/settings/payments/_components/COD_Modal.tsx

"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CodSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { updateCodSettings } from "@/app/actions/admin/settings/payments/offline-payment-method"
import { z } from "zod"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Settings } from "lucide-react"
import { Payment_Limits_Surcharge } from "./Payment_Limits_Surcharge"

interface CodModalProps {
  methodId: string
  config: any
  offlineConfig: any
}

export const COD_Modal = ({ methodId, config, offlineConfig }: CodModalProps) => {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm({
    resolver: zodResolver(CodSchema),
    defaultValues: {
      name: config.name || "Cash on Delivery",
      description: config.description || "",
      instructions: config.instructions || "",
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
            setOpen(false)
          } else {
            toast.error(data.error)
          }
        })
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cash on Delivery Settings</DialogTitle>
          <DialogDescription>
            Enable customers to pay upon receiving their order.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <Payment_Limits_Surcharge form={form} />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}