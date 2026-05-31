//File 17: app/admin/settings/payments/[identifier]/_components/Offline/Offline_Payment_Form.tsx

"use client"

import { useTransition } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { 
  SharedGatewaySchema, 
  OfflineSettingsSchema, 
  PaymentGatewayUI, 
  OfflineSettingsType 
} from "@/app/(backend)/admin/settings/payments/types-and-schemas"
import { updateOfflineSettings } from "@/app/actions/backend/settings/payments/offline-actions"
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Trash2 } from "lucide-react"

const FormSchema = z.object({
  shared: SharedGatewaySchema,
  settings: OfflineSettingsSchema
})

type FormInput = z.input<typeof FormSchema>
type FormOutput = z.output<typeof FormSchema>

export const Offline_Payment_Form = ({ method }: { method: PaymentGatewayUI }) => {
  const [isPending, startTransition] = useTransition()
  
  const settings = (method.settings || {}) as OfflineSettingsType;
  const isBankTransfer = method.identifier === "bank_transfer";

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
        instructions: settings.instructions || "",
        chequePayTo: settings.chequePayTo || "",
        addressInfo: settings.addressInfo || "",
        bankDetails: settings.bankDetails?.length ? settings.bankDetails : [{ name: "", accountNumber: "", bankName: "", sortCode: "", iban: "", bic: "" }],
      }
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "settings.bankDetails"
  })

  const onSubmit = (values: FormOutput) => {
    startTransition(() => {
      updateOfflineSettings(method.id, values.shared, values.settings)
        .then((data) => {
          if (data.success) toast.success(`${method.name} settings saved`)
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
        
        <FormRow label="Enable/Disable">
          <FormField control={form.control} name="shared.isEnabled" render={({ field }) => (
             <FormItem className="flex items-center space-x-2 space-y-0">
               <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
               <label className="text-sm font-normal text-gray-700 cursor-pointer">Enable {method.name}</label>
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
               <p className="text-xs text-gray-500 mt-1.5">Payment method description that the customer will see on your checkout.</p>
               <FormMessage />
             </FormItem>
          )} />
        </FormRow>

        <FormRow label="Instructions" isLast={!isBankTransfer}>
          <FormField control={form.control} name="settings.instructions" render={({ field }) => (
             <FormItem>
               <FormControl><Textarea {...field} value={field.value ?? ""} className="max-w-md bg-white border-gray-300 min-h-[80px]" /></FormControl>
               <p className="text-xs text-gray-500 mt-1.5">Instructions that will be added to the thank you page and emails.</p>
               <FormMessage />
             </FormItem>
          )} />
        </FormRow>

        {isBankTransfer && (
          <>
            <div className="bg-gray-50/50 px-6 py-3 border-y border-gray-200 flex items-center justify-between font-semibold text-gray-800">
              Account Details
              <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", accountNumber: "", bankName: "", sortCode: "", iban: "", bic: "" })} className="h-7 text-xs bg-white">
                <Plus className="h-3 w-3 mr-1" /> Add Account
              </Button>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-sm bg-gray-50 relative">
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 hover:text-red-700" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name={`settings.bankDetails.${index}.name`} render={({ field }) => (
                        <FormItem><FormLabel className="text-xs text-gray-600">Account Name</FormLabel><FormControl><Input {...field} value={field.value || ""} className="bg-white h-8" /></FormControl></FormItem>
                      )} />
                    <FormField control={form.control} name={`settings.bankDetails.${index}.accountNumber`} render={({ field }) => (
                        <FormItem><FormLabel className="text-xs text-gray-600">Account Number</FormLabel><FormControl><Input {...field} value={field.value || ""} className="bg-white h-8" /></FormControl></FormItem>
                      )} />
                    <FormField control={form.control} name={`settings.bankDetails.${index}.bankName`} render={({ field }) => (
                        <FormItem><FormLabel className="text-xs text-gray-600">Bank Name</FormLabel><FormControl><Input {...field} value={field.value || ""} className="bg-white h-8" /></FormControl></FormItem>
                      )} />
                    <FormField control={form.control} name={`settings.bankDetails.${index}.sortCode`} render={({ field }) => (
                        <FormItem><FormLabel className="text-xs text-gray-600">Sort Code / BSB</FormLabel><FormControl><Input {...field} value={field.value || ""} className="bg-white h-8" /></FormControl></FormItem>
                      )} />
                  </div>
                </div>
              ))}
              {fields.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No bank accounts added.</p>}
            </div>
          </>
        )}

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