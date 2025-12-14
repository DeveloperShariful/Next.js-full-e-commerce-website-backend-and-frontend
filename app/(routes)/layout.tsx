import Header from "@/components/front/header";
import Footer from "@/components/front/footer"; // ✅ Import Footer

export default function FrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer /> {/* ✅ Add Footer */}
    </div>
  );
}