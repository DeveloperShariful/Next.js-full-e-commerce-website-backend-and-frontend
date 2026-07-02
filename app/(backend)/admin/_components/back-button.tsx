"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  storageKey?: string;
  fallbackUrl?: string;
  label?: string;
}

export function BackButton({
  storageKey = "list-return-url",
  fallbackUrl = "/admin",
  label = "Back",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    const returnUrl = sessionStorage.getItem(storageKey);
    if (returnUrl) {
      router.push(returnUrl, { scroll: false });
    } else {
      router.push(fallbackUrl, { scroll: false });
    }
  };

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-1 text-[13px] text-[#2271b1] hover:text-[#135e96] hover:underline"
    >
      <ChevronLeft size={14} />
      {label}
    </button>
  );
}

interface ScrollRestorerProps {
  scrollKey?: string;
}

export function ScrollRestorer({ scrollKey = "list-scroll-y" }: ScrollRestorerProps) {
  useEffect(() => {
    const savedY = sessionStorage.getItem(scrollKey);
    if (savedY) {
      window.scrollTo({ top: parseInt(savedY), behavior: "instant" });
      sessionStorage.removeItem(scrollKey);
    }
  }, [scrollKey]);

  return null;
}
