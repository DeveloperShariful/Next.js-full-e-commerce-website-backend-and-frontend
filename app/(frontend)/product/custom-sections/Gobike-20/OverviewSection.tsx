// ফাইল পাথ: app/product/custom-sections/Gobike-20/OverviewSection.tsx
import ImageSlider from '../ImageSlider';
import AnimateOnScroll from '../AnimateOnScroll';
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
        <AnimateOnScroll direction="left">
          <div className="text-center lg:text-left lg:pr-8">
            <h2 className="text-[2.2rem] lg:text-[3rem] font-extrabold leading-[1.2] mb-6 text-[#1a202c]">
              GoBike 20: Where Young Riders Push Their Limits
            </h2>
            <p className="text-[1.1rem] leading-[1.7] text-[#4a5568]">
              For the rider aged 8–14 who lives for the thrill, the GoBike 20 is the e-bike that keeps up. Built to handle jumps, bike parks, and off-road trails with ease, it delivers real performance in a package designed for growing kids. With longer battery life, performance suspension, and a frame that can take a beating, the GoBike 20 turns every ride into an achievement. This is where kids stop playing and start riding — seriously.
            </p>
          </div>
        </AnimateOnScroll>
        <AnimateOnScroll direction="right" delay={150}>
          <div className="w-full">
            <ImageSlider images={overviewImages} />
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}