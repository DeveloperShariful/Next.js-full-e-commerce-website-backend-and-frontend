"use client";

import { Search as SearchIcon, Command } from "lucide-react";
import { useEffect, useRef } from "react";

export function Search() {
  const inputRef = useRef<HTMLInputElement>(null);

  // CMD/CTRL + K শর্টকাট লজিক
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="relative w-full max-w-md hidden sm:block group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
        <SearchIcon size={16} />
      </div>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search..."
        className="
          w-full h-10 pl-10 pr-12 rounded-lg border border-slate-200 bg-slate-50 
          text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 
          transition-all duration-200 placeholder:text-slate-400
        "
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-500">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>
    </div>
  );
}