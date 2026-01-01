import Header from "@/app/(storefront)/header-footer/header";
import Footer from "@/app/(storefront)/header-footer/footer"; // ✅ Import Footer

export default function FrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer /> 
    </div>
  );
}