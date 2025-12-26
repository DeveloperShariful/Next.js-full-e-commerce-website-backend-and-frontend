// File: app/(storefront)/page.tsx

// Actions
import { getNewArrivals } from "@/app/actions/storefront/home/get-new-arrivals";

// Components
import HeroSection from "./_components/hero-section";
import FeaturesSection from "./_components/features-section";
import NewArrivals from "./_components/new-arrivals";
import PromoBanner from "./_components/promo-banner";

export default async function HomePage() {
  
  // 1. Fetch New Arrivals
  const newArrivals = await getNewArrivals();

  return (
    <div className="bg-white font-sans text-slate-800">
      
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Features Grid */}
      <FeaturesSection />

      {/* 3. New Arrivals List */}
      <NewArrivals products={newArrivals} />

      {/* 4. Promo Banner */}
      <PromoBanner />

    </div>
  );
}