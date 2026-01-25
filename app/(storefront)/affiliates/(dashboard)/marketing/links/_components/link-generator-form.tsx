//app/(storefront)/affiliates/marketing/links/_components/link-generator-form.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Link as LinkIcon, ArrowRight, Wand2 } from "lucide-react";
import { generateLinkAction } from "@/app/actions/storefront/affiliates/mutations/generate-link";

const schema = z.object({
  destinationUrl: z.string().url("Enter a valid URL (e.g., https://gobike.au/product/123)"),
  customSlug: z.string()
    .regex(/^[a-zA-Z0-9-_]*$/, "Alphanumeric only")
    .optional(),
  campaignId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  userId: string;
  campaigns: { id: string; name: string }[];
}

export default function LinkGeneratorForm({ userId, campaigns }: Props) {
  const [isPending, startTransition] = useTransition();
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      destinationUrl: "",
      customSlug: "",
      campaignId: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const formData = { ...data, userId };
      
      const result = await generateLinkAction(formData);

      if (result.success) {
        toast.success("Link generated successfully!");
        form.reset();
        // Optimistic UI update or refresh handles the table list in parent
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      
      {/* Destination URL */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Destination URL</label>
        <div className="relative">
          <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            {...form.register("destinationUrl")}
            placeholder="https://gobike.au/shop/helmet"
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        {form.formState.errors.destinationUrl && (
          <p className="text-xs text-red-500">{form.formState.errors.destinationUrl.message}</p>
        )}
      </div>

      {/* Grid for Campaign & Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Campaign Select */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Campaign (Optional)</label>
          <select
            {...form.register("campaignId")}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">No Campaign</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Custom Slug */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Custom Alias (Optional)</label>
          <div className="flex items-center">
            <span className="bg-gray-100 border border-r-0 rounded-l-lg px-3 py-2 text-gray-500 text-xs font-mono">
              /go/
            </span>
            <input
              {...form.register("customSlug")}
              placeholder="summer-sale"
              className="w-full px-3 py-2 border rounded-r-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          {form.formState.errors.customSlug && (
            <p className="text-xs text-red-500">{form.formState.errors.customSlug.message}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-70 transition-all shadow-sm active:scale-95"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        Generate Tracking Link
      </button>

    </form>
  );
}