// app/layout.tsx

import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import NextTopLoader from 'nextjs-toploader';
import { db } from "@/lib/prisma";
import { GlobalStoreProvider } from "@/app/providers/global-store-provider"; // 🚀 Import Provider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoBike Admin",
  description: "Admin panel for GoBike e-commerce",
};

// 🚀 Made Async to fetch data
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // 1. Fetch Global Settings
  const settings = await db.storeSettings.findUnique({
    where: { id: "settings" },
  });

  return (
    <ClerkProvider>
      <html lang="en">
        <body
          suppressHydrationWarning={true}
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
          <Toaster position="top-center" />
          
          {/* 2. Wrap App with Global Store Data */}
          <GlobalStoreProvider settings={settings}>
            {children}
          </GlobalStoreProvider>
          
        </body>
      </html>
    </ClerkProvider>
  );
}