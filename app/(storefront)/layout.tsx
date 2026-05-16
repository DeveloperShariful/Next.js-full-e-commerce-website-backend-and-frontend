// app/(storefront)/layout.tsx 

import TopBar from "@/components/TopBar"; 
import Header from "@/app/(storefront)/header-footer/header";
import Footer from "@/components/Footer";
import { CartProvider } from '@/context/CartContext';
import { CompareProvider } from '@/context/CompareContext'; 

export default function FrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CompareProvider>
      <CartProvider>
        <div className="flex flex-col min-h-screen">
          <TopBar />
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer /> 
        </div>
        {/* ✅ RootLayout এ Toaster থাকায় এখান থেকে ডুপ্লিকেট রিমুভ করা হলো */}
      </CartProvider>
    </CompareProvider>
  );
}