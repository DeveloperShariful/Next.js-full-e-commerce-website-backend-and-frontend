//File: app/admin/settings/payments/_components/OfflineMethodForm.tsx

"use client"

import { useTransition } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { BankTransferSchema, ChequeSchema, CodSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { 
  updateBankTransferSettings, 
  updateChequeSettings, 
  updateCodSettings 
} from "@/app/actions/admin/settings/payments/offline-payment-method"
import { z } from "zod"
import { toast } from "sonner"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { Payment_Limits_Surcharge } from "./Payment_Limits_Surcharge"

interface OfflineFormProps {
  methodId: string
  identifier: "bank_transfer" | "cheque" | "cod"
  config: any
  offlineConfig: any
}

export const OfflineMethodForm = ({ methodId, identifier, config, offlineConfig }: OfflineFormProps) => {
  const [isPending, startTransition] = useTransition()

  // 1. Determine Schema & Default Values based on Identifier
  let schema: any = CodSchema
  let defaultValues: any = {}
  let updateAction: any = updateCodSettings

  if (identifier === "bank_transfer") {
    schema = BankTransferSchema
    updateAction = updateBankTransferSettings
    defaultValues = {
      bankDetails: offlineConfig?.bankDetails && offlineConfig.bankDetails.length > 0 
        ? offlineConfig.bankDetails.map((bank: any) => ({
            name: bank.name || bank.accountName || "",
            accountNumber: bank.accountNumber || "",
            bankName: bank.bankName || "",
            sortCode: bank.sortCode || "",
            iban: bank.iban || "",
            bic: bank.bic || ""
          }))
        : [{ name: "", accountNumber: "", bankName: "", sortCode: "", iban: "", bic: "" }]
    }
  } else if (identifier === "cheque") {
    schema = ChequeSchema
    updateAction = updateChequeSettings
    defaultValues = {
      chequePayTo: offlineConfig?.chequePayTo || "",
      addressInfo: offlineConfig?.addressInfo || ""
    }
  } else {
    // COD Defaults
    defaultValues = {
      enableForShippingMethods: offlineConfig?.enableForShippingMethods || []
    }
  }

  // Common Defaults
  const finalDefaultValues = {
    name: config.name || "",
    description: config.description || "",
    instructions: config.instructions || "",
    isEnabled: !!config.isEnabled,
    minOrderAmount: config.minOrderAmount ?? null,
    maxOrderAmount: config.maxOrderAmount ?? null,
    surchargeEnabled: config.surchargeEnabled ?? false,
    surchargeType: (config.surchargeType as "fixed" | "percentage" | null) ?? "fixed",
    surchargeAmount: config.surchargeAmount ?? 0,
    taxableSurcharge: config.taxableSurcharge ?? false,
    ...defaultValues
  }

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: finalDefaultValues
  })

  // Only for Bank Transfer
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bankDetails"
  })

  const onSubmit = (values: any) => {
    startTransition(() => {
      updateAction(methodId, values)
        .then((data: any) => {
          if (data.success) {
            toast.success("Settings updated successfully")
          } else {
            toast.error(data.error)
          }
        })
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
        
        {/* === COMMON FIELDS === */}
        <div className="grid gap-4 bg-white p-6 border rounded-lg shadow-sm">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Method Title</FormLabel>
                <FormControl><Input {...field} value={field.value || ""} /></FormControl>
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
                <FormControl><Textarea {...field} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* === CHEQUE SPECIFIC FIELDS === */}
          {identifier === "cheque" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="chequePayTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay To (Name)</FormLabel>
                    <FormControl><Input {...field} value={field.value || ""} placeholder="e.g. My Company Ltd" /></FormControl>
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
                    <FormControl><Input {...field} value={field.value || ""} placeholder="Street, City, Zip" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <FormField
            control={form.control}
            name="instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value || ""} placeholder="Instructions shown on Thank You page..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* === BANK TRANSFER SPECIFIC FIELDS === */}
        {identifier === "bank_transfer" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Bank Accounts</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => append({ name: "", accountNumber: "", bankName: "", sortCode: "", iban: "", bic: "" })}
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name={`bankDetails.${index}.name`} render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">Account Name</FormLabel><Input {...field} className="h-9 bg-white" /></FormItem>
                  )} />
                  <FormField control={form.control} name={`bankDetails.${index}.bankName`} render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">Bank Name</FormLabel><Input {...field} className="h-9 bg-white" /></FormItem>
                  )} />
                  <FormField control={form.control} name={`bankDetails.${index}.accountNumber`} render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">Account Number</FormLabel><Input {...field} className="h-9 bg-white" /></FormItem>
                  )} />
                  <FormField control={form.control} name={`bankDetails.${index}.sortCode`} render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">Sort Code</FormLabel><Input {...field} className="h-9 bg-white" /></FormItem>
                  )} />
                  <FormField control={form.control} name={`bankDetails.${index}.iban`} render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">IBAN</FormLabel><Input {...field} className="h-9 bg-white" /></FormItem>
                  )} />
                  <FormField control={form.control} name={`bankDetails.${index}.bic`} render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">BIC / SWIFT</FormLabel><Input {...field} className="h-9 bg-white" /></FormItem>
                  )} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === LIMITS & SURCHARGE === */}
        <Payment_Limits_Surcharge form={form} />

        {/* === SAVE BUTTON === */}
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