//File: app/(backend)/admin/visitors/_components/visitor-channel-country-filter.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  channelOptions: string[];
  countryOptions: string[];
}

// ⚠️ FIX: আগে এখানে plain native <select> ছিল — অনেক channel-এর নাম অনেক লম্বা
// (যেমন "adclick.g.doubleclick.net_referral") হওয়ায় mobile browser-এর নিজস্ব
// dropdown popup সেই লম্বা টেক্সট অনুযায়ী চওড়া হয়ে স্ক্রিনের বাইরে চলে যেত —
// native <select>-এর popup কোনোভাবেই CSS দিয়ে width/position নিয়ন্ত্রণ করা যায়
// না। app/(backend)/admin/orders/_components/header.tsx-এ ঠিক এই একই সমস্যার
// জন্য যে Radix DropdownMenu ব্যবহার হয়েছে (trigger-width-এ content আটকে রাখা +
// built-in viewport-aware max-height/scroll), এখানেও সেই একই প্যাটার্ন বসানো হলো।
export default function VisitorChannelCountryFilter({ channelOptions, countryOptions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [channel, setChannel] = useState(searchParams.get("channel") || "");
  const [country, setCountry] = useState(searchParams.get("country") || "");

  // Orders header.tsx-এর একই sync প্যাটার্ন — breakdown-table-এর channel/country
  // লিংক থেকে সরাসরি এসে URL বদলালে, বা browser back/forward চাপলে, dropdown-এর
  // local state যেন URL-এর সাথেই মিলে থাকে (component remount না হলেও)।
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChannel(searchParams.get("channel") || "");
    setCountry(searchParams.get("country") || "");
  }, [searchParams]);

  const hasActiveFilter = !!(searchParams.get("channel") || searchParams.get("country"));

  const applyFilters = (nextChannel: string, nextCountry: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextChannel) params.set("channel", nextChannel); else params.delete("channel");
    if (nextCountry) params.set("country", nextCountry); else params.delete("country");
    params.set("tab", "recent");
    params.set("vpage", "1");
    startTransition(() => {
      router.push(`/admin/visitors?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    setChannel("");
    setCountry("");
    applyFilters("", "");
  };

  const triggerClass =
    "h-[28px] px-2 border border-[#8c8f94] bg-white text-[#2c3338] rounded-[3px] w-[140px] text-[13px] flex items-center justify-between gap-1 outline-none focus:border-[#2271b1] disabled:opacity-60";

  // ⚠️ FIX: Content-কে trigger-এর সমান চওড়ায় (140px) আটকে রাখায় + item টেক্সট
  // truncate করায় লম্বা channel নাম ("Adclick.G.Doubleclick.Net_referral") কেটে
  // "..." হয়ে যাচ্ছিল। Content-কে trigger-নিরপেক্ষভাবে চওড়া করে দেওয়া হলো
  // (min-w দিয়ে, max-w দিয়ে খুব সরু screen-এও viewport ছাড়াবে না) আর
  // truncate-এর বদলে whitespace-normal/break-words — এখন পুরো নাম দেখা যাবে,
  // দরকার হলে ২ লাইনে wrap করে।
  const contentClass = "min-w-[220px] max-w-[85vw] border-[#8c8f94] shadow-lg p-1";

  const itemClass = (active: boolean) =>
    `cursor-pointer text-[13px] px-2 py-1.5 rounded whitespace-normal break-words leading-snug ${
      active
        ? "text-[#2271b1] font-semibold bg-[#f0f6fc]"
        : "text-[#1d2327] hover:bg-[#f6f7f7] focus:bg-[#f6f7f7]"
    }`;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button disabled={isPending} className={triggerClass}>
            <span className="truncate capitalize">{channel || "All Channels"}</span>
            <ChevronDown className="h-3 w-3 text-[#8c8f94] shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={contentClass}>
          <DropdownMenuItem className={itemClass(!channel)} onClick={() => setChannel("")}>
            All Channels
          </DropdownMenuItem>
          {channelOptions.map((c) => (
            <DropdownMenuItem key={c} className={`${itemClass(channel === c)} capitalize`} onClick={() => setChannel(c)}>
              {c}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button disabled={isPending} className={triggerClass}>
            <span className="truncate">{country || "All Countries"}</span>
            <ChevronDown className="h-3 w-3 text-[#8c8f94] shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={contentClass}>
          <DropdownMenuItem className={itemClass(!country)} onClick={() => setCountry("")}>
            All Countries
          </DropdownMenuItem>
          {countryOptions.map((c) => (
            <DropdownMenuItem key={c} className={itemClass(country === c)} onClick={() => setCountry(c)}>
              {c}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        onClick={() => applyFilters(channel, country)}
        disabled={isPending}
        className="px-2.5 py-[3px] border border-[#2271b1] bg-[#f6f7f7] text-[#2271b1] rounded-[3px] text-[13px] hover:bg-[#f0f6fc] transition-colors flex items-center gap-1 disabled:opacity-60 shrink-0"
      >
        {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
        Filter
      </button>
      {hasActiveFilter ? (
        <button onClick={clearFilters} className="text-[12px] text-[#2271b1] hover:underline shrink-0">
          Clear
        </button>
      ) : null}
    </div>
  );
}
