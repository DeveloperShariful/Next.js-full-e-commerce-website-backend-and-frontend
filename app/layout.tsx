// File: app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import NextAuthSessionProvider from "@/app/providers/session-provider";
import NextTopLoader from 'nextjs-toploader';

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
