// ফাইল পাথ: app/product/custom-sections/Gobike-12/SafeLearningSection.tsx

import TextWithImage from '../TextWithImage';

export default function SafeLearningSection() {
  return (
    <section className="w-full py-12 px-[5%] md:px-[1%] box-border bg-[#f7fafc]">
      <div className="flex flex-col gap-16">
      
        <TextWithImage
          imageUrl="https://gobikes.au/wp-content/uploads/2025/10/gobike-ebike-safe-speed-modes.webp"
          imageAlt="A happy young child confidently riding the GoBike 12 on a paved path."
          title="Ditch the Stabilisers: Master Balance the Fun Way"
          description="Forget those clunky, awkward stabilisers. The GoBike 12 is all about teaching the *real* skill of riding: balance. By focusing on gliding and steering first, your child builds core stability and coordination. This makes the jump to a pedal bike seamless and frustration-free.It’s the perfect electric bike for a 3 year old, an exciting electric bike for a 4 year old"
          reverse={false} 
        />

        <TextWithImage
          imageUrl="https://gobikes.au/wp-content/uploads/2025/10/a.webp"
          imageAlt="A young boy confidently riding his GoBike 12, feet hovering above the ground."
          title="No More Tumbles: Confidence From the Ground Up"
          description="The fear of falling is the biggest hurdle. We've eliminated it. Thanks to an ultra-low seat and lightweight frame, your child's feet can *always* touch the ground. This 'feet-down' safety net gives them a massive confidence boost, banishing tumbles and empowering them to ride independently."
          reverse={true} 
        />

        <TextWithImage
          imageUrl="https://gobikes.au/wp-content/uploads/2025/10/c.webp"
          imageAlt="The GoBike 12's durable, all-terrain tires rolling smoothly over grass."
          title="From Backyard Fun to Park Adventures"
          description="Don't let terrain limit the fun. The GoBike 12 is equipped with durable, puncture-proof tyres that handle everything from grass and garden paths to smooth pavements. It’s the perfect, reliable companion for all your little one's outdoor adventures."
          reverse={false} 
        />

        <TextWithImage
          imageUrl="https://gobikes.au/wp-content/uploads/2025/10/b.webp"
          imageAlt="A parent easily carrying the lightweight GoBike 12 with one hand."
          title="Quality You Can Trust, Fun They'll Love"
          description="Engineered with a tough yet lightweight aluminum frame and a long-lasting battery, this bike is built for endless play. With easy assembly and minimal maintenance, it offers complete peace of mind for parents and non-stop excitement for kids. A confidence-boosting electric bike for a 5 year old. Many children up to 6 years old also love it!"
          reverse={true} 
        />

      </div>
    </section>
  );
}