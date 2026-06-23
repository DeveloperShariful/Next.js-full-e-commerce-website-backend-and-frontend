// File: app/layout.tsx

import type { Metadata } from "next";
import { Toaster } from "sonner";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import NextAuthSessionProvider from "@/app/providers/session-provider";
import NextTopLoader from 'nextjs-toploader';

export const metadata: Metadata = {
  title: "GoBike Admin",
  description: "Admin panel for GoBike e-commerce",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextAuthSessionProvider>
      <html lang="en">
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
