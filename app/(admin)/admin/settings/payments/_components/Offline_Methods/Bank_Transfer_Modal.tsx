// app/admin/settings/payments/_components/Offline_Methods/Bank_Transfer_Modal.tsx

"use client"

import { useState, useTransition } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { BankTransferSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { updateBankTransferSettings } from "@/app/actions/admin/settings/payments/bank"
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
import { Plus, Trash2, Loader2, Settings } from "lucide-react"
import { Payment_Limits_Surcharge } from "../Payment_Limits_Surcharge"

interface BankModalProps {
  methodId: string
  config: any
  offlineConfig: any
}

export const Bank_Transfer_Modal = ({ methodId, config, offlineConfig }: BankModalProps) => {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm({
    resolver: zodResolver(BankTransferSchema),
    defaultValues: {
      name: config.name || "Direct Bank Transfer",
      description: config.description || "",
      instructions: config.instructions || "",
      bankDetails: offlineConfig?.bankDetails && offlineConfig.bankDetails.length > 0 
        ? offlineConfig.bankDetails 
        : [{ accountName: "", accountNumber: "", bankName: "", sortCode: "", iban: "", bic: "" }],
      
      minOrderAmount: config.minOrderAmount ?? null,
      maxOrderAmount: config.maxOrderAmount ?? null,
      surchargeEnabled: config.surchargeEnabled ?? false,
      surchargeType: (config.surchargeType as "fixed" | "percentage" | null) ?? "fixed",
      surchargeAmount: config.surchargeAmount ?? 0,
      taxableSurcharge: config.taxableSurcharge ?? false
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bankDetails"
  })

  const onSubmit = (values: z.infer<typeof BankTransferSchema>) => {
    startTransition(() => {
      updateBankTransferSettings(methodId, values)
        .then((data) => {
          if (data.success) {
            toast.success("Bank settings updated")
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bank Transfer Settings</DialogTitle>
          <DialogDescription>
            Configure your bank accounts for BACS/Wire transfers.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4">
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
                    <FormLabel>Payment Instructions</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} placeholder="Instructions added to Thank You page..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Bank Accounts</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => append({ accountName: "", accountNumber: "", bankName: "", sortCode: "", iban: "", bic: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Account
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-3 bg-muted/20 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`bankDetails.${index}.accountName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Account Name</FormLabel>
                          <Input {...field} value={field.value || ""} className="h-8" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`bankDetails.${index}.bankName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Bank Name</FormLabel>
                          <Input {...field} value={field.value || ""} className="h-8" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`bankDetails.${index}.accountNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Account Number</FormLabel>
                          <Input {...field} value={field.value || ""} className="h-8" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`bankDetails.${index}.sortCode`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Sort Code / IFSC</FormLabel>
                          <Input {...field} value={field.value || ""} className="h-8" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`bankDetails.${index}.iban`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">IBAN</FormLabel>
                          <Input {...field} value={field.value || ""} className="h-8" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`bankDetails.${index}.bic`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">BIC / SWIFT</FormLabel>
                          <Input {...field} value={field.value || ""} className="h-8" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

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