// File: app/(admin)/admin/settings/marketing-settings/_components/gtm/gtm-integration-card.tsx
"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "../status-badge";

export function GtmIntegrationCard() {
  const form = useFormContext();
  
  const isEnabled = form.watch("gtmEnabled");
  // ✅ Watch the nested JSON status field
  const isVerified = form.watch("verificationStatus.gtm");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <CardTitle>Google Tag Manager (GTM)</CardTitle>
                <CardDescription>Manage your GTM container scripts.</CardDescription>
            </div>
            <StatusBadge isEnabled={isEnabled} isVerified={isVerified} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="gtmEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Enable GTM</FormLabel>
                <FormDescription>Injects GTM script into the storefront.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        
        {isEnabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="gtmContainerId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Container ID</FormLabel>
                    <FormControl>
                        <Input placeholder="GTM-XXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="dataLayerName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Data Layer Name</FormLabel>
                    <FormControl>
                        <Input placeholder="dataLayer" {...field} />
                    </FormControl>
                    </FormItem>
                )}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <FormField
                control={form.control}
                name="gtmAuth"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>GTM Auth (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="Envirnoment Auth String" {...field} />
                    </FormControl>
                    <FormDescription>For GTM Environments.</FormDescription>
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="gtmPreview"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>GTM Preview (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="env-xx" {...field} />
                    </FormControl>
                    <FormDescription>Preview environment identifier.</FormDescription>
                    </FormItem>
                )}
                />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}