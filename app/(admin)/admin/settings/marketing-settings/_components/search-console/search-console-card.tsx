// File: app/(admin)/admin/settings/marketing-settings/_components/search-console/search-console-card.tsx
"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "../status-badge";

export function SearchConsoleCard() {
  const form = useFormContext();
  
  const verificationCode = form.watch("gscVerificationCode");
  const isVerified = form.watch("verificationStatus.searchConsole");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <CardTitle>Google Search Console</CardTitle>
                <CardDescription>Verify your site ownership and API access.</CardDescription>
            </div>
            {/* Logic: Enabled if code exists, Verified if DB says true */}
            <StatusBadge isEnabled={!!verificationCode} isVerified={isVerified} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="gscVerificationCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>HTML Tag Verification Code</FormLabel>
              <FormControl>
                <Input placeholder="content='...'" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gscServiceAccountJson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Account JSON (API Access)</FormLabel>
              <FormControl>
                <Textarea 
                    placeholder='{"type": "service_account", ...}' 
                    className="font-mono text-xs min-h-[100px]"
                    {...field} 
                />
              </FormControl>
              <FormDescription>Paste the full JSON content from Google Cloud Console.</FormDescription>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}