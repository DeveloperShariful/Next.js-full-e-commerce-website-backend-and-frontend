"use client";

import { useState, useRef, useEffect } from "react";
import { ReactionType } from "@prisma/client";

export const REACTIONS: { type: ReactionType; emoji: string; label: string; color: string }[] = [
  { type: "LIKE", emoji: "👍", label: "Like", color: "#1877F2" },
  { type: "LOVE", emoji: "❤️", label: "Love", color: "#F33E58" },
  { type: "HAHA", emoji: "😂", label: "Haha", color: "#F7B125" },
  { type: "WOW", emoji: "😮", label: "Wow", color: "#F7B125" },
  { type: "SAD", emoji: "😢", label: "Sad", color: "#F7B125" },
  { type: "ANGRY", emoji: "😡", label: "Angry", color: "#E9710F" },
];

export function reactionMeta(type: ReactionType | null | undefined) {
  return REACTIONS.find(r => r.type === type) ?? null;
}

interface Props {
  activeType: ReactionType | null;
  onPick: (type: ReactionType) => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

export default function ReactionPicker({ activeType, onPick, disabled, fullWidth }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  }, []);

  const openPicker = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShowPicker(true);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setShowPicker(false), 300);
  };

  const active = reactionMeta(activeType);

  return (
    <div
      ref={containerRef}
      className={`relative ${fullWidth ? "w-full" : "inline-block"}`}
      onMouseEnter={openPicker}
      onMouseLeave={scheduleClose}
    >
      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1 bg-white rounded-full shadow-lg border border-[#DADDE1] px-2 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-150">
          {REACTIONS.map(r => (
            <button
              key={r.type}
              type="button"
              disabled={disabled}
              onClick={() => { onPick(r.type); setShowPicker(false); }}
              title={r.label}
              className="text-2xl leading-none hover:scale-125 transition-transform duration-150 disabled:opacity-50"
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onPick(activeType ?? "LIKE")}
        className={`flex items-center justify-center gap-1 px-1 py-2 rounded-md text-[13px] sm:text-[15px] font-semibold whitespace-nowrap transition-colors disabled:opacity-50 hover:bg-[#F2F2F2] ${fullWidth ? "w-full" : ""}`}
        style={{ color: active ? active.color : "#65676B" }}
      >
        <span className="text-base leading-none">{active ? active.emoji : "👍"}</span>
        {active ? active.label : "Like"}
      </button>
    </div>
  );
}
