// app/(frontend)/bikes/_components/BikeComparisonTable.tsx

import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/prisma";
import { compareSpecsMap, staticSpecLabels, StaticSpecs } from "@/lib/compareDataMap";

const MODELS = [
  { slug: "ebike-for-kids-12-inch-electric-bike-ages-2-5", label: "GoBike 12" },
  { slug: "ebike-for-sale-16-inch-gobike-ages-5-9", label: "GoBike 16" },
  { slug: "20-inch-electric-bikes-for-sale-ebike-for-kids", label: "GoBike 20" },
  { slug: "gobike-24-inch-electric-bike-teens-high-speed-performance-for-ages-13", label: "GoBike 24" },
];

// Every value here comes straight from lib/compareDataMap.ts (already verified,
// real per-model specs used elsewhere on /compare) — nothing invented here.
// Full spec sheet (all fields, reviews, dynamic attributes) lives on /compare.
const ROW_KEYS: Array<keyof StaticSpecs> = [
  "ageRange",
  "seatHeight",
  "frame",
  "wheels",
  "motor",
  "speedModes",
  "fork",
  "brakes",
  "battery",
  "rideTime",
  "chargeTime",
  "netWeight",
  "maxWeight",
];

export default async function BikeComparisonTable() {
  const products = await db.product.findMany({
    where: { slug: { in: MODELS.map((m) => m.slug) } },
    select: { slug: true, featuredImage: true, price: true, salePrice: true },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  return (
    <section id="compare-models" className="mb-8 md:mb-12 scroll-mt-20">
      <h2 className="text-[1.3rem] md:text-[1.6rem] font-bold text-gray-900 mb-2 text-center">
        GoBike 12 vs 16 vs 20 vs 24: Compare All Models
      </h2>
      <p className="text-gray-600 text-center max-w-2xl mx-auto mb-6 text-sm md:text-base leading-relaxed">
        A quick side-by-side of age range, power, and battery for all four GoBike models — so you can pick the right size in seconds.
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
        <table className="w-full min-w-[680px] border-collapse text-sm md:text-base">
          <caption className="sr-only">
            Comparison of GoBike 12, GoBike 16, GoBike 20 and GoBike 24 electric bike specifications, including age range, motor power, battery, and price.
          </caption>
          <thead>
            <tr className="bg-gray-50">
              <th scope="col" className="p-3 md:p-4 text-left font-bold text-gray-500 text-xs md:text-sm uppercase tracking-wide w-[130px] border-b border-gray-200">
                Model
              </th>
              {MODELS.map((m) => {
                const product = bySlug.get(m.slug);
                const price = product ? Number(product.salePrice ?? product.price) : null;
                return (
                  <th key={m.slug} scope="col" className="p-3 md:p-4 text-center align-top border-b border-l border-gray-200">
                    <Link href={`/product/${m.slug}`} className="flex flex-col items-center gap-1.5 group">
                      <div className="relative w-16 h-16 md:w-20 md:h-20 bg-[#f9f9f9] rounded-md overflow-hidden">
                        {product?.featuredImage ? (
                          <Image
                            src={product.featuredImage}
                            alt={`${m.label} electric bike`}
                            fill
                            className="object-contain p-1"
                            sizes="80px"
                          />
                        ) : null}
                      </div>
                      <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {m.label}
                      </span>
                      {price !== null && (
                        <span className="text-[#ff3613] font-extrabold text-sm md:text-base">
                          From ${price.toFixed(2)}
                        </span>
                      )}
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ROW_KEYS.map((key, i) => (
              <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                <th scope="row" className="p-3 md:p-4 text-left font-semibold text-gray-800 text-xs md:text-sm border-b border-gray-100">
                  {staticSpecLabels[key]}
                </th>
                {MODELS.map((m) => (
                  <td key={m.slug} className="p-3 md:p-4 text-center text-gray-600 text-xs md:text-sm border-b border-l border-gray-100">
                    {compareSpecsMap[m.slug]?.[key] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-5">
        <Link
          href="/compare"
          className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-full hover:bg-gray-700 transition-colors text-sm md:text-base"
        >
          Compare Full Specs Side-by-Side →
        </Link>
      </div>
    </section>
  );
}
