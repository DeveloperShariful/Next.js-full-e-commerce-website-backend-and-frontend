// ফাইল পাথ: app/product/custom-sections/Gobike-24/PowerSection.tsx

import TextWithImage from '../TextWithImage';

export default function PowerSection() {
  return (
    <section className="w-full py-12 px-[5%] md:px-[1%] box-border bg-[#f7fafc]">
      <div className="flex flex-col gap-16">
      
        {/* Section 1: 1500W Power */}
        <TextWithImage
          imageUrl="https://gobikes.au/wp-content/uploads/2025/11/Gobike-24inch-Electric-Dirt-Bike-–-Durable-Kids-Electric-Bike-for-Trail-Riding.webp"
          imageAlt="Close up of the 1500W hub motor on the GoBike 24."
          title="2500W of Pure Adrenaline"
          description="At the heart of the GoBike 24 lies a beastly 2500W brushless motor. It delivers explosive acceleration and the torque needed to crush steep inclines. This is serious power for serious riders."
          reverse={false} 
        />

        {/* Section 2: Suspension */}
        <TextWithImage
          imageUrl="https://gobikes.au/wp-content/uploads/2025/11/Kids-Electric-Bike-Australia-24inch-Gobike-–-The-Ultimate-Ebike-for-Outdoor-Adventure.webp"
          imageAlt="FASTACE rear shock suspension system."
          title="Advanced Suspension System"
          description="No bump is too big. Equipped with TIM hydraulic double-shoulder front forks and a FASTACE rear air shock, the suspension is fully adjustable to match your riding style and terrain."
          reverse={true} 
        />

        {/* Section 3: Handling */}
        <TextWithImage
          imageUrl="https://gobikes.au/wp-content/uploads/2025/12/Gobike-24inch-Electric-Dirt-Bike-–-Durable-Kids-Electric-Bike-for-Trail-Riding-kids-ebike.webp"
          imageAlt="Rider carving a turn on the GoBike 24."
          title="Precision Handling & Control"
          description="The 24-inch Kenda fat tires combined with a perfectly balanced aluminum frame offer unmatched grip and handling. Corner with confidence and stay in control at high speeds."
          reverse={false} 
        />

        {/* Section 4: Battery */}
        <TextWithImage
          imageUrl="https://gobikes.au/wp-content/uploads/2025/11/Best-Off-Road-Ebike-for-Kids-–-24inch-Gobike-Electric-Mountain-Bike-on-Dirt-Trails.webp"
          imageAlt="48V Lithium battery on the GoBike 24."
          title="Long-Range 48-55V Power"
          description="Ride longer with the 48V 15Ah lithium-ion battery. Secured safely within the frame yet easily removable, it powers your adventures for up to 3hours on a single charge."
          reverse={true} 
        />

      </div>
    </section>
  );
}