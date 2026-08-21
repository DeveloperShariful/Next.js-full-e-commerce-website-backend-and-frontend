import Link from "next/link";

const QUICK_LINKS = [
  { href: "/bikes", label: "Electric Bikes", emoji: "🚴" },
  { href: "/electric-bike-parts", label: "Spare Parts", emoji: "🔧" },
  { href: "/blog", label: "Blog & Guides", emoji: "📖" },
  { href: "/contact", label: "Contact Us", emoji: "💬" },
];

/**
 * Fills the empty gap between "end of feed" and the site's global footer with
 * something useful instead of blank space — a closing message plus a handful of
 * the most useful pages to jump to next (more internal linking out of Community).
 */
export default function CommunityFeedFooter() {
  return (
    <div className="mt-8 bg-white rounded-xl border border-[#DADDE1] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="px-4 pt-4 pb-2 text-center">
        <p className="text-[26px] leading-none mb-1">🎉</p>
        <p className="text-[15px] font-bold text-[#050505]">You&apos;re all caught up</p>
        <p className="text-[13px] text-[#65676B] mt-0.5">That&apos;s every post for now — check back soon for more rider stories.</p>
      </div>

      <div className="flex justify-center sm:grid sm:grid-cols-5 gap-1 px-2 sm:px-4 pb-3 sm:pb-4 overflow-x-auto sm:overflow-visible">
        {QUICK_LINKS.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="flex flex-col items-center gap-1 rounded-lg p-2 hover:bg-[#F0F2F5] transition-colors w-[74px] sm:w-auto shrink-0 sm:shrink"
          >
            <span className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0" style={{ backgroundColor: "#F0F2F5" }}>{l.emoji}</span>
            <span className="text-[11px] font-semibold text-[#050505] text-center leading-tight whitespace-nowrap">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
