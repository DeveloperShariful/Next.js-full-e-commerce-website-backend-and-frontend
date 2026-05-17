// app/(frontend)/layout.tsx 

import TopBar from "@/components/TopBar"; 
import Header from "@/app/(frontend)/header-footer/header";
import Footer from "@/components/Footer";
import FloatingCompareBar from "@/components/FloatingCompareBar"; 
import { CartProvider } from '@/context/CartContext';
import { CompareProvider } from '@/context/CompareContext'; 

export default function FrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CompareProvider>
      <CartProvider>
        <div className="flex flex-col min-h-screen relative">
          <TopBar />
          <Header />
          
          <main className="flex-grow">
            {children}
          </main>
          
          <Footer /> 
          <FloatingCompareBar />
        </div>
      </CartProvider>
    </CompareProvider>
  );
}