// ফাইল পাথ: app/product/custom-sections/Gobike-24/OverviewSection.tsx
import ImageSlider from '../ImageSlider';

const overviewImages = [
  { src: 'https://gobikes.au/wp-content/uploads/2025/12/Gobike-24inch-Electric-Dirt-Bike-–-Durable-Kids-Electric-Bike-for-Trail-Riding-kids.webp', alt: 'GoBike 24 Pro hitting a jump on a dirt track. electric balance bike 24inch' },
  //{ src: 'https://gobikes.au/wp-content/uploads/2025/11/24inch-Gobike-Kids-Electric-Bike-–-Best-Battery-Powered-Ebike-for-Boys.webp', alt: 'GoBike 24 Pro hitting a jump on a dirt track.' },
  // { src: 'https://gobikes.au/wp-content/uploads/2025/11/Gobike-Kids-Electric-Bike-–-24inch-Ebike-Childrens-Battery-Motorbike-Alternative.webp', alt: 'Teenager riding the GoBike 24 electric bike off-road.' },
  //{ src: 'https://gobikes.au/wp-content/uploads/2025/11/Gobike-24inch-Kids-Electric-Bike-–-High-Performance-Ebike-for-Kids-Teens-Australia.webp', alt: 'Side view of the powerful GoBike 24 Inch Pro.' },
  { src: 'https://gobikes.au/wp-content/uploads/2025/11/24inch-Gobike-Electric-Balance-Bike-–-Powerful-Childrens-Battery-Motorbike-for-Off-Road.webp', alt: 'Teenager riding GoBike 24 inch electric dirt bike on a forest trail with tall trees. GoBike 24 Inch Electric Balance Bike' },
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