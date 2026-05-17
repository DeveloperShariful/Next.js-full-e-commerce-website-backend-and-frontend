// ফাইল পাথ: app/product/custom-sections/Gobike-12/OverviewSection.tsx

import ImageSlider from '../ImageSlider';

const overviewImages = [
  { src: 'https://gobikes.au/wp-content/uploads/2025/10/H.webp', alt: 'A young child learning on the GoBike 12-inch' },
  { src: 'https://gobikes.au/wp-content/uploads/2025/10/gobike-au-kids-ebike-christmas-sale.webp', alt: 'Close up of the GoBike 12-inch frame' },
  { src: 'https://gobikes.au/wp-content/uploads/2025/10/gobike-kids-ebike-gift-guide.webp', alt: 'A happy toddler with the GoBike 12 e-bike' },
  { src: 'https://gobikes.au/wp-content/uploads/2025/10/gobike-au-australian-owned-brand.webp', alt: 'the baby with the GoBike 12 e-bike' },
  { src: 'https://gobikes.au/wp-content/uploads/2025/10/gobike-au-1-year-warranty-kids-ebikes.webp', alt: 'A happy kid with the GoBike 12 e-bike' },
  { src: 'https://gobikes.au/wp-content/uploads/2025/10/gobike-12-safety-features-for-toddlers.webp', alt: 'two  kids with the GoBike 12 e-bike' },
];

export default function OverviewSection() {
  return (
    <section className="w-full py-12 px-[5%] md:px-[1%] box-border">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-10 lg:gap-12 items-center max-w-[1200px] mx-auto">
        <div className="text-center lg:text-left lg:pr-8">
          <h2 className="text-[2.2rem] lg:text-[3rem] font-extrabold leading-[1.2] mb-6 text-[#1a202c]">
            GoBike 12: The Easiest Way to Teach Your Kid to Ride
          </h2>
          <p className="text-[1.1rem] leading-[1.7] text-[#4a5568]">
            Say goodbye to tears and tricky training wheels. The GoBike 12 (ages 2-5) is engineered to be the safest, easiest way for your child to learn. This is not just a bike; it is a confidence-builder. By focusing on balance first, your little rider will master the basics in no time. It is light, durable, and ready for every Aussie backyard. Give the gift of confidence and start their riding journey today.
          </p>
        </div>
        <div className="w-full">
          <ImageSlider images={overviewImages} />
        </div>
      </div>
    </section>
  );
}