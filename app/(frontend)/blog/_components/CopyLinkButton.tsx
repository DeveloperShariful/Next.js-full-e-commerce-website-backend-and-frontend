"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex-1 md:flex-none text-center px-6 py-2.5 bg-gray-700 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition-colors"
    >
      {copied ? "✓ Copied!" : "Copy Link"}
    </button>
  );
}
