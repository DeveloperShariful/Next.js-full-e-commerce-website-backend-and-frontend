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
            GoBike 24 Pro: Serious Power for Serious Young Riders
          </h2>
          <p className="text-[1.1rem] leading-[1.7] text-[#4a5568]">
            The GoBike 24 Pro is not for beginners — it is for riders aged 13 and above who are ready to own the trails. The most powerful bike in the GoBike lineup, it is engineered to handle rugged forest paths, steep dirt tracks, and anything in between. With a pro-grade motor, a robust frame built for serious off-road abuse, and the torque to match teenage ambition, the GoBike 24 Pro is the e-bike that earns respect on every ride. For the young rider who has outgrown ordinary — this is their machine.
          </p>
        </div>
        <div className="w-full">
          <ImageSlider images={overviewImages} />
        </div>
      </div>
    </section>
  );
}