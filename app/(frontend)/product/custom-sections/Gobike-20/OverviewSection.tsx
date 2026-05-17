// ফাইল পাথ: app/product/custom-sections/Gobike-20/OverviewSection.tsx
import ImageSlider from '../ImageSlider';
import styles from '../GobikeSections.module.css';

const overviewImages = [
  { src: 'https://gobikes.au/wp-content/uploads/2025/10/gobike-12-lightweight-aluminum-frame.webp', alt: 'A young rider catching air on a jump with the GoBike 20 at a bike park.' },
  { src: 'https://gobikes.au/wp-content/uploads/2025/10/kids-ebike-durable-tires-gobike.webp', alt: 'Action shot of a kid jumping the GoBike 20, showcasing its performance suspension.' },
  { src: 'https://gobikes.au/wp-content/uploads/2025/08/Gobike-kids-electric-bike-ebike-for-kids-5-scaled-1.webp', alt: 'An excited boy celebrating with his brand new GoBike 20 box.' },
  //{ src: 'https://gobikes.au/wp-content/uploads/2025/08/Gobike-kids-electric-bike-ebike-for-kids-2-scaled-1.webp', alt: 'Two children with their GoBike e-bikes enjoying a day out on a sandy beach.' },
];


export default function OverviewSection() {
  return (
    // .sectionContainer replaced
    <section className="w-full py-12 px-[5%] md:px-[1%] box-border">
      {/* .overviewGrid replaced */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-10 lg:gap-12 items-center max-w-[1200px] mx-auto">
        {/* .overviewText replaced */}
        <div className="text-center lg:text-left lg:pr-8">
          {/* .mainTitle replaced */}
          <h2 className="text-[2.2rem] lg:text-[3rem] font-extrabold leading-[1.2] mb-6 text-[#1a202c]">
            GoBike 12: The Easiest Way to Teach Your Kid to Ride
          </h2>
          {/* .mainDescription replaced */}
          <p className="text-[1.1rem] leading-[1.7] text-[#4a5568]">
            Say goodbye to tears and tricky training wheels. The GoBike 12 (ages 2-5) is engineered to be the safest, easiest way for your child to learn. This is not just a bike; it is a confidence-builder. By focusing on balance first, your little rider will master the basics in no time. It is light, durable, and ready for every Aussie backyard. Give the gift of confidence and start their riding journey today.
          </p>
        </div>
        {/* .overviewSlider replaced */}
        <div className="w-full">
          <ImageSlider images={overviewImages} />
        </div>
      </div>
    </section>
  );
}