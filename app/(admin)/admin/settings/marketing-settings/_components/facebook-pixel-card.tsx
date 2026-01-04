// File: app/(admin)/admin/settings/marketing-settings/_components/facebook-pixel-card.tsx
"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "./status-badge";

export function FacebookPixelCard() {
  const form = useFormContext();

  const isEnabled = form.watch("fbEnabled");
  // ✅ Watch the nested JSON status field
  const isVerified = form.watch("verificationStatus.facebook");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
             <div className="space-y-1">
                <CardTitle>Meta (Facebook) Pixel</CardTitle>
                <CardDescription>Setup Pixel, Conversions API (CAPI) and Data Processing.</CardDescription>
            </div>
            <StatusBadge isEnabled={isEnabled} isVerified={isVerified} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="fbEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Enable Facebook Pixel</FormLabel>
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
                    name="fbPixelId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Pixel ID</FormLabel>
                        <FormControl>
                            <Input placeholder="1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="fbTestEventCode"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Test Event Code</FormLabel>
                        <FormControl>
                            <Input placeholder="TEST1234" {...field} />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                </div>

                <FormField
                control={form.control}
                name="fbAccessToken"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Access Token (CAPI)</FormLabel>
                    <FormControl>
                        <Textarea 
                            placeholder="EAAG..." 
                            className="min-h-[80px] font-mono text-xs"
                            {...field} 
                        />
                    </FormControl>
                    </FormItem>
                )}
                />
                
                <FormField
                control={form.control}
                name="fbDomainVerification"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Domain Verification String</FormLabel>
                    <FormControl>
                        <Input placeholder="exampleverification123" {...field} />
                    </FormControl>
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="fbDataProcessingOptions"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Data Processing Options (JSON)</FormLabel>
                    <FormControl>
                        <Input 
                            placeholder='["LDU", 1, 1000]' 
                            className="font-mono"
                            {...field} 
                        />
                    </FormControl>
                    <FormDescription>Example: ["LDU", 1, 1000] for Limited Data Use (California).</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </>
        )}
      </CardContent>
    </Card>
  );
}