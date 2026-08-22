// app/(frontend)/retailers/page.tsx

import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authorised GoBike Retailers Australia | Find a Store Near You",
  description:
    "Find your nearest authorised GoBike retailer across NSW, VIC, QLD and WA. All retailers are fully authorised to sell, service and support warranty claims on GoBike electric bikes.",
  alternates: { canonical: "https://gobike.au/retailers" },
  keywords: [
    "gobike retailers", "kids electric bike store australia", "gobike dealer",
    "electric bike shop nsw", "kids ebike retailer", "gobike authorised dealer",
  ],
  openGraph: {
    title: "Authorised GoBike Retailers Australia | Find a Store Near You",
    description: "Find your nearest authorised GoBike retailer across NSW, VIC, QLD and WA.",
    url: "https://gobike.au/retailers",
    siteName: "GoBike Australia",
    images: [{ url: "https://gobike.au/wp-content/uploads/2025/11/gobike-ebike-safe-speed-modes.jpg", width: 1200, height: 630, alt: "GoBike Authorised Retailers Australia" }],
    locale: "en_AU",
    type: "website",
  },
  twitter: { card: "summary_large_image", site: "@GoBikeAU", title: "Authorised GoBike Retailers Australia", description: "Find your nearest authorised GoBike store." },
};

const NSW_RETAILERS = [
  {
    name: "On Two Wheels Motorsports",
    address: "Unit 1, 18 Holborn Circuit",
    suburb: "Gledswood Hills NSW 2557",
    mapQuery: "Unit+1,+18+Holborn+Circuit,+Gledswood+Hills+NSW+2557",
  },
  {
    name: "Camden Cycles",
    address: "184 Argyle Street",
    suburb: "Camden NSW 2570",
    mapQuery: "184+Argyle+Street,+Camden+NSW+2570",
  },
  {
    name: "Engadine Cycles and Scooters",
    address: "26 Station Street",
    suburb: "Engadine NSW 2233",
    mapQuery: "26+Station+Street,+Engadine+NSW+2233",
  },
  {
    name: "Valley Bikeco",
    address: "26 Macquarie St",
    suburb: "Singleton NSW 2330",
    mapQuery: "26+Macquarie+St,+Singleton+NSW+2330",
  },
  {
    name: "MXR Motorsports Australia",
    address: "132 Princes Highway",
    suburb: "South Nowra NSW 2541",
    mapQuery: "132+Princes+Highway,+South+Nowra+NSW+2541",
  },
  {
    name: "Penrith Pit Bike",
    address: "Shop 6A/55-61 York Rd",
    suburb: "Jamisontown NSW 2750",
    mapQuery: "Shop+6A/55-61+York+Rd,+Jamisontown+NSW+2750",
  },
  {
    name: "MiniRacer",
    address: "6/73 Willarong Rd",
    suburb: "Caringbah NSW 2229",
    mapQuery: "6/73+Willarong+Rd,+Caringbah+NSW+2229",
  },
];

const OTHER_STATES = [
  {
    state: "Victoria",
    color: "green",
    dot: "bg-green-600",
    label: "text-green-700",
    badge: "bg-green-50 border-green-100",
    seeking: false,
    retailer: {
      name: "A&M Colour",
      address: "Office 4/77 Magna Vista Rise",
      suburb: "Narre Warren VIC 3805",
      mapQuery: "Office+4/77+Magna+Vista+Rise,+Narre+Warren+VIC+3805",
    },
  },
  {
    state: "Queensland",
    color: "orange",
    dot: "bg-orange-600",
    label: "text-orange-700",
    badge: "bg-orange-50 border-orange-100",
    seeking: false,
    retailer: {
      name: "Cooroy Motorcycles",
      address: "Shed 4, 5 Taylor Ct",
      suburb: "Cooroy QLD 4563",
      mapQuery: "Shed+4,+5+Taylor+Ct,+Cooroy+QLD+4563",
    },
  },
  {
    state: "Western Australia",
    color: "purple",
    dot: "bg-purple-600",
    label: "text-purple-700",
    badge: "bg-purple-50 border-purple-100",
    seeking: false,
    retailer: {
      name: "Eazy Bikes",
      address: "Unit 1/12 Farral Road",
      suburb: "Midvale WA 6056",
      mapQuery: "Unit+1/12+Farral+Road,+Midvale+WA+6056",
    },
  },
];

function MapPinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://gobike.au" },
    { "@type": "ListItem", position: 2, name: "Authorised Retailers", item: "https://gobike.au/retailers" },
  ],
};

// Google's Store/LocalBusiness guidance treats streetAddress, addressLocality,
// addressRegion (state) and postalCode as separate required sub-properties of
// PostalAddress — our suburb strings are all "{City} {STATE} {postcode}", so we
// split them out here rather than dumping the whole string into addressLocality.
function buildStoreAddress(streetAddress: string, suburb: string) {
  const match = suburb.match(/^(.+?)\s+(NSW|VIC|QLD|WA|SA|TAS|NT|ACT)\s+(\d{4})$/);
  return {
    "@type": "PostalAddress",
    streetAddress,
    addressLocality: match ? match[1] : suburb,
    addressRegion: match ? match[2] : undefined,
    postalCode: match ? match[3] : undefined,
    addressCountry: "AU",
  };
}

const GOBIKE_PARENT_ORG = { "@type": "Organization", name: "GoBike Australia", url: "https://gobike.au" };

const retailerListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Authorised GoBike Retailers Australia",
  description: "All authorised GoBike electric bike retailers across Australia",
  numberOfItems: NSW_RETAILERS.length + 3,
  itemListElement: [
    ...NSW_RETAILERS.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Store",
        name: r.name,
        address: buildStoreAddress(r.address, r.suburb),
        url: `https://www.google.com/maps/search/?api=1&query=${r.mapQuery}`,
        parentOrganization: GOBIKE_PARENT_ORG,
      },
    })),
    { "@type": "ListItem", position: NSW_RETAILERS.length + 1, item: { "@type": "Store", name: "A&M Colour", address: buildStoreAddress("Office 4/77 Magna Vista Rise", "Narre Warren VIC 3805"), parentOrganization: GOBIKE_PARENT_ORG } },
    { "@type": "ListItem", position: NSW_RETAILERS.length + 2, item: { "@type": "Store", name: "Cooroy Motorcycles", address: buildStoreAddress("Shed 4, 5 Taylor Ct", "Cooroy QLD 4563"), parentOrganization: GOBIKE_PARENT_ORG } },
    { "@type": "ListItem", position: NSW_RETAILERS.length + 3, item: { "@type": "Store", name: "Eazy Bikes", address: buildStoreAddress("Unit 1/12 Farral Road", "Midvale WA 6056"), parentOrganization: GOBIKE_PARENT_ORG } },
  ],
};

export default function RetailersPage() {
  return (
    <div className="bg-white min-h-screen pb-16 font-sans text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumbJsonLd, retailerListJsonLd]) }} />
      <Breadcrumbs pageTitle="Authorized Retailers" />

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-6 lg:pt-10">
        {/* Hero */}
        <div className="mb-10">
          <div className="inline-block bg-black text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 mb-3 rounded-sm">
            Find a Store
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-3 text-black">
            Authorised <span className="text-blue-600">GoBike</span> Retailers
          </h1>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl leading-snug">
            Visit one of our authorised retailers across Australia to see GoBike
            electric bikes in person. All retailers are fully authorised to
            sell, service, and support warranty claims.
          </p>
        </div>

        {/* NSW Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              New South Wales
            </h2>
            <span className="ml-auto text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
              {NSW_RETAILERS.length} locations
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {NSW_RETAILERS.map((r) => (
              <a
                key={r.name}
                href={`https://www.google.com/maps/search/?api=1&query=${r.mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-[#f8f9fa] border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <p className="font-bold text-gray-900 text-sm group-hover:text-blue-700 transition-colors leading-tight mb-2">
                  {r.name}
                </p>
                <div className="flex items-start gap-1.5 text-gray-500 group-hover:text-blue-600 transition-colors">
                  <MapPinIcon />
                  <div className="text-[11px] leading-snug">
                    <p>{r.address}</p>
                    <p>{r.suburb}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* VIC, QLD, WA */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-14">
          {OTHER_STATES.map((s) => (
            <div key={s.state}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${s.dot} shrink-0`}></span>
                <h2 className={`text-xs font-bold ${s.label} uppercase tracking-widest`}>
                  {s.state}
                </h2>
              </div>

              {s.seeking ? (
                <div
                  className={`border ${s.badge} rounded-xl p-4 flex flex-col gap-2`}
                >
                  <span className="text-[11px] font-black uppercase tracking-wide text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-md self-start leading-tight">
                    Seeking Applicants
                  </span>
                  <p className="text-xs text-gray-500 leading-snug">
                    Starting January 2027. Interested in becoming an authorised
                    retailer?{" "}
                    <Link
                      href="/contact"
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Contact us
                    </Link>
                    .
                  </p>
                </div>
              ) : s.retailer ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${s.retailer.mapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group border ${s.badge} rounded-xl p-4 hover:border-current transition-all flex flex-col gap-2 block`}
                >
                  <p className={`font-bold text-gray-900 text-sm group-hover:${s.label} transition-colors leading-tight`}>
                    {s.retailer.name}
                  </p>
                  <div className="flex items-start gap-1.5 text-gray-500">
                    <MapPinIcon />
                    <div className="text-[11px] leading-snug">
                      <p>{s.retailer.address}</p>
                      <p>{s.retailer.suburb}</p>
                    </div>
                  </div>
                </a>
              ) : null}
            </div>
          ))}
        </div>

        {/* Become a Retailer CTA */}
        <div className="bg-black text-white p-8 md:p-12 rounded-2xl text-center border-t-4 border-blue-600">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest mb-4">
            Become an Authorised Retailer
          </h2>
          <p className="max-w-xl mx-auto text-sm text-gray-400 leading-relaxed mb-6">
            Interested in stocking GoBike electric bikes in your store? We are
            always looking to expand our retailer network across Australia.
            Reach out and our team will be in touch.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </div>
  );
}
