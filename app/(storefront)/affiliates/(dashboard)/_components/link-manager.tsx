//app/(storefront)/affiliates/_components/link-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Link as LinkIcon, QrCode, ArrowRight, Loader2, Search, Globe, MousePointer2, Sparkles, Check, Copy } from "lucide-react";
import { generateLinkAction } from "@/app/actions/storefront/affiliates/_services/marketing-service";
import { cn } from "@/lib/utils";
// ✅ IMPORT GLOBAL STORE
import { useGlobalStore } from "@/app/providers/global-store-provider";

// ... (CopyButton Component Unchanged) ...
interface CopyButtonProps {
  text: string;
  className?: string;
  variant?: "solid" | "ghost" | "outline";
}

function CopyButton({ text, className, variant = "solid" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy.");
    }
  };

  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer";
  
  const variants = {
    solid: "bg-white border border-gray-200 shadow-sm text-gray-700 hover:bg-gray-50 px-3 py-1.5",
    ghost: "text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50",
    outline: "border border-blue-200 text-blue-700 hover:bg-blue-50 px-3 py-1.5"
  };

  return (
    <button onClick={handleCopy} type="button" className={cn(baseStyles, variants[variant], className)}>
      {copied ? <><Check className="w-3.5 h-3.5 text-green-600" />{variant !== "ghost" && <span className="text-green-600">Copied</span>}</> : <><Copy className="w-3.5 h-3.5" />{variant !== "ghost" && "Copy"}</>}
    </button>
  );
}

// =========================================================
// MAIN COMPONENT
// =========================================================

interface LinkManagerProps {
  initialLinks: any[];
  campaigns: any[];
  userId: string;
  defaultSlug: string;
  baseUrl?: string;
  paramName?: string;
}

export default function LinkManager({ 
  initialLinks, 
  campaigns, 
  userId, 
  defaultSlug, 
  baseUrl, 
  paramName = "ref" 
}: LinkManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  
  // ✅ USE GLOBAL STORE FOR BASE URL FALLBACK
  const { seo } = useGlobalStore();
  const effectiveBaseUrl = baseUrl || seo.siteUrl || (typeof window !== 'undefined' ? window.location.origin : "");

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { destinationUrl: "", customSlug: "", campaignId: "" }
  });

  const onSubmit = (data: any) => {
    startTransition(async () => {
      // NOTE: userId is handled in session now, but keeping for compatibility if needed or pass undefined
      // If generateLinkAction expects data without userId as per previous updates:
      const res = await generateLinkAction(data); 
      
      if (res.success) {
        toast.success("Link created successfully!");
        reset();
      } else {
        toast.error(res.message);
      }
    });
  };

  // Dynamic Main Link
  const defaultLink = `${effectiveBaseUrl}/?${paramName}=${defaultSlug}`;

  const filteredLinks = initialLinks.filter(link => 
    link.destinationUrl.toLowerCase().includes(searchTerm.toLowerCase()) || 
    link.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (link.campaign?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      
      {/* 1. HERO CARD */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" /> Your Main Affiliate Link
            </h3>
            <p className="text-indigo-100 text-sm max-w-md">
              Share this link anywhere. Purchases earn you commissions.
            </p>
          </div>
          <div className="w-full md:w-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2 pl-4 flex items-center gap-3 min-w-[320px]">
            <Globe className="w-4 h-4 text-indigo-200 shrink-0" />
            <code className="text-sm font-mono truncate flex-1 text-white">{defaultLink}</code>
            <CopyButton text={defaultLink} className="bg-white text-indigo-700 hover:bg-indigo-50 border-0 font-bold shrink-0 shadow-sm" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. GENERATOR FORM */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-24">
            <div className="mb-6 pb-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-indigo-600" /> Create Custom Link
                </h3>
                <p className="text-xs text-gray-500 mt-1">Generate deep links for products.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">Target URL</label>
                <input 
                  {...register("destinationUrl", { 
                    required: "Destination URL is required",
                    pattern: { value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, message: "Invalid URL" }
                  })}
                  placeholder={`${effectiveBaseUrl}/shop/helmet`}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
                {errors.destinationUrl && <p className="text-xs text-red-500">{errors.destinationUrl.message as string}</p>}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">Custom Slug (Optional)</label>
                <div className="flex items-center">
                  <span className="bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg px-3 py-2.5 text-xs text-gray-500 font-medium">go/</span>
                  <input 
                    {...register("customSlug", { pattern: { value: /^[a-zA-Z0-9-_]+$/, message: "Alphanumeric only" } })}
                    placeholder="summer-sale"
                    className="w-full border border-gray-300 rounded-r-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                {errors.customSlug && <p className="text-xs text-red-500">{errors.customSlug.message as string}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">Campaign</label>
                <select {...register("campaignId")} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none">
                  <option value="">No Campaign</option>
                  {campaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <button type="submit" disabled={isPending} className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 shadow-lg">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <ArrowRight className="w-4 h-4"/>}
                Generate Link
              </button>
            </form>
          </div>
        </div>

        {/* 3. LINKS LIST */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900">Active Links ({filteredLinks.length})</h3>
            <div className="relative w-full sm:w-64">
               <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
               <input placeholder="Search..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          
          <div className="space-y-3">
            {filteredLinks.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400 flex flex-col items-center">
                    <LinkIcon className="w-10 h-10 mb-2 opacity-20" />
                    <p>No links found.</p>
                </div>
            ) : (
                filteredLinks.map((link: any) => {
                    const shortUrl = `${effectiveBaseUrl}/go/${link.slug}`;
                    return (
                    <div key={link.id} className="bg-white p-5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all group">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-bold text-indigo-700 text-base bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 break-all">/go/{link.slug}</span>
                                    {link.campaign && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-gray-200">{link.campaign.name}</span>}
                                </div>
                                <p className="text-xs text-gray-500 truncate flex items-center gap-1"><ArrowRight className="w-3 h-3 shrink-0" /> <span className="truncate">{link.destinationUrl}</span></p>
                            </div>
                            <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg border border-gray-100 shrink-0">
                                <div className="text-center px-2">
                                    <span className="block font-bold text-lg text-gray-900 leading-tight">{link.clickCount.toLocaleString()}</span>
                                    <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><MousePointer2 className="w-3 h-3" /> Clicks</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between sm:justify-start gap-3 flex-wrap">
                            <div className="flex-1 sm:flex-none min-w-[120px]"><CopyButton text={shortUrl} className="w-full sm:w-auto bg-gray-900 text-white hover:bg-black border-0 py-2 px-4 shadow-sm" /></div>
                            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm"><QrCode className="w-3.5 h-3.5" /><span className="hidden sm:inline">QR Code</span></button>
                            <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm ml-auto sm:ml-0"><Globe className="w-3.5 h-3.5" /><span className="hidden sm:inline">Test</span></a>
                        </div>
                    </div>
                )})
            )}
          </div>
        </div>
      </div>
    </div>
  );
}