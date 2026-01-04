// File: app/(admin)/admin/settings/marketing-settings/_components/merchant-center-card.tsx
"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "./status-badge";

export function MerchantCenterCard() {
  const form = useFormContext();
  
  const isEnabled = form.watch("gmcContentApiEnabled");
  const isVerified = form.watch("verificationStatus.merchantCenter");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <CardTitle>Google Merchant Center</CardTitle>
                <CardDescription>Configure Google Shopping and Content API settings.</CardDescription>
            </div>
            <StatusBadge isEnabled={isEnabled} isVerified={isVerified} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-row items-center justify-between border-b pb-4">
            <h3 className="text-sm font-medium">Content API Integration</h3>
            <FormField
                control={form.control}
                name="gmcContentApiEnabled"
                render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal text-xs text-muted-foreground">Enable API</FormLabel>
                </FormItem>
                )}
            />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
            control={form.control}
            name="gmcMerchantId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Merchant ID</FormLabel>
                <FormControl>
                    <Input placeholder="123456789" {...field} />
                </FormControl>
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="gmcTargetCountry"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Target Country</FormLabel>
                <FormControl>
                    <Input placeholder="AU" {...field} />
                </FormControl>
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="gmcLanguage"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Language Code</FormLabel>
                <FormControl>
                    <Input placeholder="en" {...field} />
                </FormControl>
                </FormItem>
            )}
            />
        </div>
      </CardContent>
    </Card>
  );
}