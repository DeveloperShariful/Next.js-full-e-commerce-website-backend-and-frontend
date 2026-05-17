// ফাইল পাথ: app/product/custom-sections/Gobike-16/BalanceSection.tsx
import TextWithImage from '../TextWithImage';
// import styles from '../GobikeSections.module.css'; // CSS Module সরানো হয়েছে

export default function BalanceSection() {
  return (
    // .sectionContainer & .coloredBackground replaced
    <section className="w-full py-12 px-[5%] md:px-[1%] box-border bg-[#f7fafc]">
      {/* wrapperStyle replaced with flex-col & gap-16 */}
      <div className="flex flex-col gap-16">
      
        {/* === সেকশন ১: Unleash Their Inner Trail Boss === */}
        <TextWithImage
          imageUrl="https://gobikes.au/wp-content/uploads/2025/10/d.webp"
          imageAlt="A proud young boy smiling with his new Gobike 16 electric dirt bike indoors."
          title="Unleash Their Inner Trail Boss"
          description="When they've mastered the basics and are hungry for more, the GoBike 16 is ready for them. Its powerful 700W motor unlocks higher speeds and a true electric dirt bike feel, empowering your little rider to conquer bigger challenges and explore further than ever before."
          reverse={false} // ছবি বামে
        />

        {/* === সেকশন ২: Confident Control, Serious Stopping Power === */}
        <TextWithImage
          imageUrl="https://gobikes.au/wp-content/uploads/2025/10/e-1.webp"
          imageAlt="A kid confidently riding his Gobike 16 at a park, showcasing its safety and control."
          title="Confident Control, Serious Stopping Power"
          description="More power calls for smarter safety. That's why the GoBike 16 features front and rear hydraulic disc brakes. This pro-level system delivers sharp, responsive braking in any weather, giving you peace of mind and your rider the confidence to handle any situation."
          reverse={true} // ছবি ডানে
        />

        {/* === সেকশন ৩: Conquer Any Trail in Comfort === */}
        <TextWithImage
          imageUrl="https://gobikes.au/wp-content/uploads/2025/10/f.webp"
          imageAlt="A young rider on a wooden ramp with his Gobike 16, featuring advanced front suspension."
          title="Conquer Any Trail in Comfort"
          description="Rough trails are part of the fun, but harsh bumps aren't. The advanced hydraulic front suspension with 80mm of travel soaks up impacts, providing a smooth, stable ride. This means better control, less fatigue, and longer, happier days on the track."
          reverse={false} // ছবি বামে
        />

        {/* === সেকশন ৪: Grows With Them, Adventure After Adventure === */}
        <TextWithImage
          imageUrl="https://gobikes.au/wp-content/uploads/2025/10/G.webp"
          imageAlt="A Gobike 16 showing its adjustable seat, perfect for a growing child."
          title="Grows With Them, Adventure After Adventure"
          description="Kids grow up fast. The GoBike 16 keeps up. With a highly adjustable seat and handlebars, you can dial in the perfect ergonomic fit for years of riding. It’s a smart investment in long-term fun, built tough enough to be passed down to the next adventurer."
          reverse={true} // ছবি ডানে
        />

      </div>
    </section>
  );
}