// File: app/(admin)/admin/settings/marketing-settings/_components/merchant-center/connection-settings.tsx
"use client";

import { useState, useMemo, useTransition } from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, CheckCircle, Key, PlugZap, Save, Loader2, Globe } from "lucide-react";
import { StatusBadge } from "../status-badge";
import { toast } from "sonner";
import { testMerchantConnection } from "@/app/actions/admin/settings/marketing-settings/merchant_center/test-connection";
import { updateMarketingConfig } from "@/app/actions/admin/settings/marketing-settings/update-marketing-config";
// ✅ Import the Type
import { MarketingSettingsValues } from "@/app/(admin)/admin/settings/marketing-settings/_schema/marketing-validation";

export function MerchantConnectionSettings() {
  const form = useFormContext();
  const [showJson, setShowJson] = useState(false);
  const [isTesting, startTestTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();
  
  const isEnabled = form.watch("gmcContentApiEnabled");
  const isVerified = form.watch("verificationStatus.merchantCenter");
  const currentJson = form.watch("gscServiceAccountJson");
  const currentMerchantId = form.watch("gmcMerchantId");

  const jsonStatus = useMemo(() => {
    if (!currentJson || currentJson.trim() === "") return "empty";
    try {
        const parsed = JSON.parse(currentJson);
        if (parsed.type === "service_account" || parsed.project_id) return "valid";
        return "invalid_structure";
    } catch (e) {
        return "invalid_syntax";
    }
  }, [currentJson]);

  const handleTestConnection = () => {
    if (jsonStatus !== "valid") return toast.error("Enter a valid Service Account JSON.");
    if (!currentMerchantId) return toast.error("Enter Merchant ID.");

    startTestTransition(async () => {
        const result = await testMerchantConnection(currentJson, currentMerchantId);
        result.success ? toast.success(result.message) : toast.error(result.message);
    });
  };

  const handleSave = async () => {
    const isValid = await form.trigger(["gmcContentApiEnabled", "gmcMerchantId", "gscServiceAccountJson"]);
    if (!isValid) return toast.error("Please fix form errors.");
    
    // ✅ FIX: Type assertion added here
    const values = form.getValues() as MarketingSettingsValues;

    startSaveTransition(async () => {
        const result = await updateMarketingConfig(values);
        result.success ? toast.success(result.message) : toast.error(result.message);
        if (result.newStatus) form.setValue("verificationStatus", result.newStatus);
    });
  };

  return (
    <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
      <CardHeader className="bg-slate-50/50">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">Google Merchant Center</CardTitle>
                <CardDescription>Directly sync products to Google Shopping.</CardDescription>
            </div>
            <StatusBadge isEnabled={isEnabled} isVerified={isVerified} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm hover:bg-slate-50/50 transition-colors">
            <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Content API Sync</h3>
                <p className="text-xs text-muted-foreground">Automatically push products to Google.</p>
            </div>
            <FormField
                control={form.control}
                name="gmcContentApiEnabled"
                render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                </FormItem>
                )}
            />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
            control={form.control}
            name="gmcMerchantId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Merchant ID</FormLabel>
                <FormControl>
                    <Input placeholder="123456789" className="font-mono focus-visible:ring-amber-500" {...field} />
                </FormControl>
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="gmcTargetCountry"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center gap-1"><Globe className="w-3 h-3"/> Target Country</FormLabel>
                <FormControl>
                    <Input placeholder="AU" className="uppercase" maxLength={2} {...field} />
                </FormControl>
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="gmcLanguage"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Language</FormLabel>
                <FormControl>
                    <Input placeholder="en" className="lowercase" maxLength={2} {...field} />
                </FormControl>
                </FormItem>
            )}
            />
        </div>

        <div className="pt-4 border-t mt-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-600" />
                    <FormLabel className="mb-0 text-amber-800 font-semibold">Service Account JSON</FormLabel>
                </div>
                <Button 
                    type="button" variant="outline" size="sm" 
                    onClick={() => setShowJson(!showJson)}
                    className="h-8 text-xs hover:bg-amber-50 border-amber-200 text-amber-700 transition-all active:scale-95"
                >
                    {showJson ? <><EyeOff className="w-3 h-3 mr-2" /> Hide Key</> : <><Eye className="w-3 h-3 mr-2" /> {jsonStatus === "empty" ? "Add Key" : "View/Edit Key"}</>}
                </Button>
            </div>

            {!showJson && jsonStatus === "valid" && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-md flex items-center gap-2 text-sm text-emerald-700 shadow-sm">
                    <CheckCircle className="w-4 h-4" /> <span>Securely Configured</span>
                </div>
            )}

            {showJson && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <FormField
                    control={form.control}
                    name="gscServiceAccountJson"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Textarea 
                                placeholder='Paste JSON key here...' 
                                className={`font-mono text-xs min-h-[150px] bg-slate-50 border-slate-300 focus:border-amber-500 focus:ring-amber-500 transition-all ${jsonStatus.startsWith("invalid") ? "border-red-500 ring-red-500" : ""}`}
                                {...field} 
                            />
                        </FormControl>
                        {jsonStatus === "invalid_syntax" && <FormMessage className="text-red-500">Invalid JSON syntax</FormMessage>}
                        </FormItem>
                    )}
                    />
                </div>
            )}
        </div>
      </CardContent>

      <CardFooter className="bg-slate-50 border-t py-4 flex flex-col sm:flex-row justify-between gap-3">
         <Button 
            type="button" 
            variant="outline" 
            onClick={handleTestConnection} 
            disabled={isTesting || jsonStatus !== "valid"}
            className="w-full sm:w-auto cursor-pointer hover:bg-white hover:shadow transition-all active:scale-95 border-blue-200 text-blue-700 hover:text-blue-800"
         >
            {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlugZap className="mr-2 h-4 w-4" />}
            Test Connection
         </Button>

         <Button 
            type="button" 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full sm:w-auto cursor-pointer shadow-md hover:shadow-lg transition-all active:scale-95 bg-slate-900 hover:bg-slate-800 text-white"
         >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
         </Button>
      </CardFooter>
    </Card>
  );
}