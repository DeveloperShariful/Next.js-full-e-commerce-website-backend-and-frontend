// File: app/(storefront)/checkout/_components/forms/Contact_Info_Form.tsx

"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export const Contact_Info_Form = () => {
  const { control } = useFormContext();

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-6 space-y-4">
        
        {/* Email Input */}
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Create Account Checkbox */}
        <FormField
          control={control}
          name="createAccount"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Create an account?
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  Save your information for faster checkout next time.
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="text-sm text-muted-foreground mt-2">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:underline font-medium">
            Log in
          </Link>
        </div>

      </CardContent>
    </Card>
  );
};