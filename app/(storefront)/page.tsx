// File: app/page.tsx
"use client";

import HeroSlider from './_components/HeroSlider';
import TrustBadges from './_components/TrustBadges';
import ProductCollection from './_components/ProductCollection';
import OurStory from './_components/OurStory';
import SmarterChoice from './_components/SmarterChoice';
import DifferenceSection from './_components/DifferenceSection';
import CommunitySection from './_components/CommunitySection';
import VideoReviews from './_components/VideoReviews';
import FaqSection from './_components/FaqSection';
import { getNewArrivals } from "@/app/actions/storefront/home/get-new-arrivals";



// Components



import NewArrivals from "./_components/new-arrivals";


export default function HomePageClient() {
  const Divider = () => (
    <div className="max-w-[1500px] mx-auto px-4">
      <hr className="border-t border-gray-200 my-4" />
    </div>
  );

  return (
    <>
      <HeroSlider />
      <TrustBadges />
      <Divider />
      <ProductCollection />
      <Divider />
      <OurStory />
      <Divider />
      <SmarterChoice />
      <Divider />

      <Divider />
      <DifferenceSection />
      <CommunitySection />
      <Divider />
      <Divider />
      <VideoReviews />
      <Divider />
      <FaqSection />
      <Divider />
    </>
  );
}