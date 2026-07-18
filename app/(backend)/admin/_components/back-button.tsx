"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const anchorRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);
  const [geometry, setGeometry] = useState({ top: 46, left: 0 });

  const handleBack = () => {
    const returnUrl = sessionStorage.getItem(storageKey);
    if (returnUrl) {
      router.push(returnUrl, { scroll: false });
    } else {
      router.push(fallbackUrl, { scroll: false });
    }
  };

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    const updateGeometry = () => {
      const rect = main.getBoundingClientRect();
      setGeometry({ top: rect.top, left: rect.left });
    };
    updateGeometry();
    window.addEventListener("resize", updateGeometry);

    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { root: main, threshold: 0 }
    );
    if (anchorRef.current) observer.observe(anchorRef.current);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateGeometry);
    };
  }, []);

  const btn = (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-1 text-[13px] text-[#2271b1] hover:text-[#135e96] hover:underline"
    >
      <ChevronLeft size={14} />
      {label}
    </button>
  );

  return (
    <>
      <div ref={anchorRef} className="py-1.5">
        {btn}
      </div>

      {isStuck && (
        <div
          className="fixed z-[200] bg-[#f0f0f1] border-b border-[#dcdcde] shadow-sm py-1.5 px-2"
          style={{ top: geometry.top, left: geometry.left, right: 0 }}
        >
          {btn}
        </div>
      )}
    </>
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
