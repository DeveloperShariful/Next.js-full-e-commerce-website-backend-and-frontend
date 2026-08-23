// File: app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import NextAuthSessionProvider from "@/app/providers/session-provider";
import NextTopLoader from 'nextjs-toploader';
import Script from 'next/script';

export const metadata: Metadata = {
  metadataBase: new URL('https://gobike.au'),

  title: {
    default: 'GoBike - Kids Electric Bikes Australia | Top Rated Balance Bikes',
    template: '%s | GoBike Australia',
  },
  description: "Australia's #1 rated electric balance bikes for kids (ages 2-16). Engineered for safety, built for fun. Shop 12\", 16\", 20\" & 24\" e-bikes with 1-year warranty.",

  applicationName: 'GoBike Australia',
  authors: [{ name: 'GoBike Australia', url: 'https://gobike.au' }],
  generator: 'Next.js',
  keywords: [
    'kids electric bike',
    'kids ebike',
    'electric balance bike',
    'electric dirt bike for kids',
    'GoBike',
    'toddler electric bike',
    'kids motorcycle Australia',
    'buy kids ebike online',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'GoBike Team',
  publisher: 'GoBike Australia',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    title: 'GoBike - Kids Electric Bikes Australia',
    description: "Australia's top-rated electric balance bikes for kids. Safe, fun, and built for adventure.",
    url: 'https://gobike.au',
    siteName: 'GoBike Australia',
    images: [
      {
        url: 'https://gobike.au/wp-content/uploads/2025/11/gobike-ebike-safe-speed-modes.jpg',
        width: 1200,
        height: 630,
        alt: 'A happy child riding a GoBike electric bike in Australia.',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    site: '@GoBikeAU',
    title: 'GoBike - Kids Electric Bikes Australia',
    description: "Australia's top-rated electric balance bikes for kids.",
    creator: '@GoBikeAU',
    images: ['https://gobike.au/wp-content/uploads/2025/11/gobike-ebike-safe-speed-modes.jpg'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: '/',
    languages: {
      'en-AU': '/',
      'x-default': '/',
    },
  },

  other: {
    'geo.region': 'AU-NSW',
    'geo.placename': 'Camden',
    'geo.position': '-34.05;150.69',
    'ICBM': '-34.05, 150.69',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextAuthSessionProvider>
      <html lang="en-AU" suppressHydrationWarning>
        <body
          suppressHydrationWarning={true}
          className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
        >
          {/* Third-party widget scripts (Trustpilot, etc.) sometimes reject their
              own internal XHR promises with the raw ProgressEvent instead of an
              Error when a request is aborted by page navigation/refresh — this
              surfaces as a non-actionable "[object ProgressEvent]" unhandled
              rejection. `beforeInteractive` guarantees this listener registers
              before Next's own runtime (and its dev error overlay) attaches
              theirs, so stopImmediatePropagation actually keeps the overlay from
              firing on it. Only that specific, non-descriptive shape is
              silenced — real Error-based rejections from our own code still
              propagate and get reported normally. */}
          <Script id="suppress-third-party-progressevent-rejections" strategy="beforeInteractive">
            {`
              window.addEventListener('unhandledrejection', function (event) {
                if (typeof ProgressEvent !== 'undefined' && event.reason instanceof ProgressEvent) {
                  event.preventDefault();
                  if (event.stopImmediatePropagation) event.stopImmediatePropagation();
                  console.warn('[suppressed] Third-party script rejected with a raw ProgressEvent (network request likely aborted by navigation):', event.reason);
                }
              });
            `}
          </Script>
          {/* Global structured data — Organization + WebSite + SearchAction */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify([
                {
                  "@context": "https://schema.org",
                  "@type": "Organization",
                  "@id": "https://gobike.au/#organization",
                  name: "GoBike Australia",
                  url: "https://gobike.au",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://gobikes.au/wp-content/uploads/2025/06/GOBIKE-Electric-Bike-for-kids.webp",
                    width: 1861,
                    height: 430,
                  },
                  contactPoint: {
                    "@type": "ContactPoint",
                    contactType: "customer support",
                    email: "gobike@gobike.au",
                    areaServed: "AU",
                    availableLanguage: "English",
                  },
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: "Camden South",
                    addressRegion: "NSW",
                    addressCountry: "AU",
                  },
                  sameAs: [
                    "https://www.facebook.com/Go-Bike-104997195659873",
                    "https://www.instagram.com/gobikeoz/",
                    "https://www.youtube.com/@Gobike-r7b",
                    "https://www.tiktok.com/@gobikeoz",
                    "https://www.linkedin.com/company/112710706",
                  ],
                },
                {
                  "@context": "https://schema.org",
                  "@type": "WebSite",
                  "@id": "https://gobike.au/#website",
                  url: "https://gobike.au",
                  name: "GoBike Australia",
                  publisher: { "@id": "https://gobike.au/#organization" },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: "https://gobike.au/shop?q={search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ]),
            }}
          />
          <NextTopLoader
            color="#56ff08ff"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #2271b1,0 0 5px #2271b1"
          />
          <Toaster position="top-center" richColors />
          {children}
        </body>
      </html>
    </NextAuthSessionProvider>
  );
}
