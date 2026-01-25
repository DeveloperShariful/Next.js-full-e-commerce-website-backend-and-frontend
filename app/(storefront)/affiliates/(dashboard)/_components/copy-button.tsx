//app/(storefront)/affiliates/_components/copy-button.tsx

"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CopyButtonProps {
  text: string;
  className?: string;
  variant?: "solid" | "ghost" | "outline";
}

export default function CopyButton({ text, className, variant = "solid" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy.");
    }
  };

  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-md text-xs font-medium transition-all duration-200";
  
  const variants = {
    solid: "bg-white border border-gray-200 shadow-sm text-gray-700 hover:bg-gray-50 px-3 py-1.5",
    ghost: "text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50",
    outline: "border border-blue-200 text-blue-700 hover:bg-blue-50 px-3 py-1.5"
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(baseStyles, variants[variant], className)}
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-600" />
          {variant !== "ghost" && <span className="text-green-600">Copied</span>}
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          {variant !== "ghost" && "Copy"}
        </>
      )}
    </button>
  );
}