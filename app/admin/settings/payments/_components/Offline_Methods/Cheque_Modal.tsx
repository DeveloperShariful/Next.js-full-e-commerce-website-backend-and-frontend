// app/admin/settings/payments/_components/Offline_Methods/Cheque_Modal.tsx
"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChequeSchema } from "@/app/admin/settings/payments/schemas"
import { updateChequeSettings } from "@/app/actions/admin/settings/payments/cheque"
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

interface ChequeModalProps {
  methodId: string
  config: any
  offlineConfig: any
}

export const Cheque_Modal = ({ methodId, config, offlineConfig }: ChequeModalProps) => {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<z.infer<typeof ChequeSchema>>({
    resolver: zodResolver(ChequeSchema),
    defaultValues: {
      name: config.name || "Cheque Payment",
      description: config.description || "",
      instructions: config.instructions || "",
      chequePayTo: offlineConfig?.chequePayTo || "",
      addressInfo: offlineConfig?.addressInfo || ""
    }
  })

  const onSubmit = (values: z.infer<typeof ChequeSchema>) => {
    startTransition(() => {
      updateChequeSettings(methodId, values)
        .then((data) => {
          if (data.success) {
            toast.success("Cheque settings updated")
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
          <DialogTitle>Cheque Payment Settings</DialogTitle>
          <DialogDescription>
            Instructions for customers paying by cheque.
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