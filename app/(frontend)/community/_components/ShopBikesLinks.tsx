import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/prisma";

const BIKES = [
  { slug: "ebike-for-kids-12-inch-electric-bike-ages-2-5", label: "GoBike 12", age: "Ages 2–5" },
  { slug: "ebike-for-sale-16-inch-gobike-ages-5-9", label: "GoBike 16", age: "Ages 5–9" },
  { slug: "20-inch-electric-bikes-for-sale-ebike-for-kids", label: "GoBike 20", age: "Ages 8–14" },
  { slug: "gobike-24-inch-electric-bike-teens-high-speed-performance-for-ages-13", label: "GoBike 24", age: "Ages 13+" },
];

/**
 * Routes internal link equity from Community's user-generated content back to the
 * actual product pages — the point of building a public customer showcase in the
 * first place. Static, reliable links rather than fuzzy-matching free-text tags to
 * products (tags are arbitrary user input, too unreliable to auto-link safely).
 */
export default async function ShopBikesLinks() {
  const products = await db.product.findMany({
    where: { slug: { in: BIKES.map(b => b.slug) } },
    select: { slug: true, featuredImage: true },
  });
  const imageBySlug = new Map(products.map(p => [p.slug, p.featuredImage]));

  return (
    <div className="bg-white rounded-xl border border-[#DADDE1] overflow-hidden mb-3 sm:mb-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="px-1 pt-2 pb-1 sm:px-4 sm:pt-4 sm:pb-3 flex items-center gap-1.5 sm:gap-2">
        <span className="w-6 h-6 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-lg shrink-0" style={{ backgroundColor: "#FFF6D9" }}>🚴</span>
        <div>
          <p className="text-[12px] sm:text-[15px] font-bold text-[#050505] leading-tight">Shop GoBike Electric Bikes</p>
          <p className="text-[11px] sm:text-[12px] text-[#65676B] hidden sm:block">Find the perfect ride for every age</p>
        </div>
      </div>

      {/* 4-column grid at every size — each tile fills an equal share of the row,
          so there's never leftover space or a need to guess a fixed pixel width. */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 px-1 sm:px-4 pb-2 sm:pb-4">
        {BIKES.map(b => {
          const image = imageBySlug.get(b.slug);
          return (
            <Link
              key={b.slug}
              href={`/product/${b.slug}`}
              className="group flex flex-col items-center text-center gap-0.5 rounded-lg border border-[#E4E6EB] hover:border-[#FDB931] bg-[#FAFAFA] hover:bg-[#FFFBEA] transition-colors p-1 sm:p-2"
            >
              <div className="relative w-full aspect-square rounded-md overflow-hidden bg-white">
                {image ? (
                  <Image src={image} alt={b.label} fill className="object-contain p-1 group-hover:scale-105 transition-transform" sizes="120px" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-[20px] sm:text-[26px]">🚲</span>
                )}
              </div>
              <span className="text-[13px] font-bold text-[#050505] mt-0.5 sm:mt-1">{b.label}</span>
              <span className="text-[11px] text-[#65676B]">{b.age}</span>
            </Link>
          );
        })}
      </div>

      <Link
        href="/bikes"
        className="block text-center text-[11px] sm:text-[14px] font-extrabold py-1.5 sm:py-3 hover:brightness-95 transition-[filter] tracking-wide"
        style={{ background: "linear-gradient(90deg, #FFD700 0%, #FDB931 100%)", color: "#111" }}
      >
        VIEW ALL GOBIKE ELECTRIC BIKES →
      </Link>
    </div>
  );
}
