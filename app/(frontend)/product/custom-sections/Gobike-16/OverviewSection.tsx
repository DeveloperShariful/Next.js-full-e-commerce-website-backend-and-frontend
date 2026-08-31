import ImageSlider from '../ImageSlider';
import AnimateOnScroll from '../AnimateOnScroll';
import styles from '../GobikeSections.module.css';

// Image list with descriptive alt tags for SEO and accessibility
const overviewImages = [
  { src: 'https://gobikes.au/wp-content/uploads/2025/10/gobike-removable-battery-pack.webp', alt: 'A young boy confidently riding the Gobike 16 electric bike on a pump track.' },
  { src: 'https://gobikes.au/wp-content/uploads/2025/10/GoBike-3767.webp', alt: 'Kid catching air on a Gobike 16 electric dirt bike on an off-road trail.' },
  { src: 'https://gobikes.au/wp-content/uploads/2025/10/best-electric-bike-for-kids-australia-gobike.webp', alt: 'A child learning to ride the Gobike 16 with family support in a park.' },
  { src: 'https://gobikes.au/wp-content/uploads/2025/10/GoBike-3892.webp', alt: 'Young rider confidently manoeuvring the Gobike 16 on an off-road dirt course.' },
];

export default function OverviewSection() {
  return (
    // .sectionContainer replaced
    <section className="w-full pt-[5px] pb-12 md:py-12 px-[1px] md:px-[1%] box-border">
      {/* .overviewGrid replaced */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-10 lg:gap-12 items-center max-w-[1200px] mx-auto">
        {/* .overviewText replaced */}
        <AnimateOnScroll direction="left">
          <div className="text-left lg:pr-8">
            {/* .mainTitle replaced */}
            <h2 className="text-[1.3rem] lg:text-[1.6rem] font-extrabold leading-[1.2] mb-6 text-[#1a202c]">
              GoBike 16: The Perfect Step-Up for Your Growing Adventurer
            </h2>
            <p className="text-[1.1rem] leading-[1.7] text-[#4a5568]">
              Your kid has mastered the basics — now it is time to level up. The GoBike 16 is built for riders aged 5–9 who are ready to explore pump tracks, dirt trails, and everything in between. With a removable battery pack for easy charging, a lightweight frame, and just the right amount of power, the GoBike 16 gives your child the freedom to ride further and the confidence to ride better. It is not just a bigger bike — it is their first real adventure machine.
            </p>
          </div>
        </AnimateOnScroll>
        {/* .overviewSlider replaced */}
        <AnimateOnScroll direction="right" delay={150}>
          <div className="w-full">
            <ImageSlider images={overviewImages} />
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}