//File: app/(backend)/admin/visitors/_components/visitor-search-bar.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";

export default function VisitorSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    params.set("vpage", "1");
    // ফলাফল শুধু "Recent Visitors" ট্যাবেই দেখা যায় — অন্য ট্যাব থেকে সার্চ
    // করলেও সেই ট্যাবেই নিয়ে যাওয়া হচ্ছে, নাহলে ফলাফল চোখেই পড়বে না।
    params.set("tab", "recent");
    startTransition(() => {
      router.push(`/admin/visitors?${params.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-1">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={isPending}
        placeholder="Search by IP address or channel..."
        className="border border-[#8c8f94] bg-white h-[30px] px-2 text-[13px] text-[#32373c] focus:ring-1 focus:border-[#2271b1] focus:ring-[#2271b1] outline-none w-[240px] disabled:bg-gray-100"
      />
      <button
        type="submit"
        disabled={isPending}
        className="border border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors whitespace-nowrap disabled:opacity-70 flex items-center gap-1.5"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
        Search
      </button>
    </form>
  );
}
