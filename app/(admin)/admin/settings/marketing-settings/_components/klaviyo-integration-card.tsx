// File: app/(admin)/admin/settings/marketing-settings/_components/klaviyo-integration-card.tsx
"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "./status-badge";

export function KlaviyoIntegrationCard() {
  const form = useFormContext();

  const isEnabled = form.watch("klaviyoEnabled");
  // ✅ Watch the nested JSON status field
  const isVerified = form.watch("verificationStatus.klaviyo");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <CardTitle>Klaviyo Email Marketing</CardTitle>
                <CardDescription>Connect Klaviyo and configure List IDs.</CardDescription>
            </div>
            <StatusBadge isEnabled={isEnabled} isVerified={isVerified} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="klaviyoEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Enable Klaviyo</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {isEnabled && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="klaviyoPublicKey"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Public Key</FormLabel>
                        <FormControl>
                            <Input placeholder="AbCdEf" {...field} />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="klaviyoPrivateKey"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Private API Key</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="pk_..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-medium">List Configurations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="klaviyoListIds.newsletter"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Newsletter List ID</FormLabel>
                            <FormControl>
                                <Input placeholder="List ID" {...field} />
                            </FormControl>
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="klaviyoListIds.abandonedCart"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Abandoned Cart List ID</FormLabel>
                            <FormControl>
                                <Input placeholder="List ID" {...field} />
                            </FormControl>
                            </FormItem>
                        )}
                        />
                    </div>
                </div>
                
                <div className="flex flex-col gap-2 border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Event Tracking</h4>
                    <FormField
                    control={form.control}
                    name="klaviyoTrackViewedProduct"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2">
                        <FormLabel className="font-normal">Track "Viewed Product"</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="klaviyoTrackAddedToCart"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2">
                        <FormLabel className="font-normal">Track "Added to Cart"</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                </div>
            </>
        )}
      </CardContent>
    </Card>
  );
}