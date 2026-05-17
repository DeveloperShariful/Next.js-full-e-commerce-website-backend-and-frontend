// ফাইল পাথ: app/product/custom-sections/Gobike-20/PowerSection.tsx
import TextWithImage from '../TextWithImage';
// import styles from '../GobikeSections.module.css'; // CSS Module সরানো হয়েছে

export default function PowerSection() {
  return (
    // .sectionContainer & .coloredBackground replaced
    <section className="w-full py-12 px-[5%] md:px-[1%] box-border bg-[#f7fafc]">
      {/* wrapperStyle replaced */}
      <div className="flex flex-col gap-16">
      
        {/* === সেকশন ১: পাওয়ার এবং পারফরম্যান্স === */}
        <TextWithImage
          imageUrl="https://gobikes.au/wp-content/uploads/2025/10/gobike-20-hydraulic-disc-brakes-closeup.webp"
          imageAlt="A young rider leans into a turn on a pump track with the GoBike 20 e-bike."
          title="Unleash Pro-Level Power"
          description="The GoBike 20 isn't just a bike; it's a statement. Featuring a massive 1200W brushless motor, it delivers breathtaking acceleration and the torque to conquer steep inclines. It's the ultimate machine for young riders who are serious about off-road performance."
          reverse={false} // ছবি বামে
        />

        {/* === সেকশন ২: মজবুত ফ্রেম, পারিবারিক অ্যাডভেঞ্চার === */}
        <TextWithImage
          imageUrl="https://gobikes.au/wp-content/uploads/2025/10/free-shipping-gobike-electric-bikes-australia.webp"
          imageAlt="A father sharing a fun ride on the GoBike 20 with his young daughter in a park."
          title="Built Tough for Family Fun"
          description="Our rugged frame isn't just for trails; it's strong enough for shared moments. The GoBike 20 is built to handle more, creating opportunities for family adventures and making memories that will last a lifetime. It’s reliable, durable, and ready for anything."
          reverse={true} // ছবি ডানে
        />

        {/* === সেকশন ৩: পাম্প ট্র্যাকে নিখুঁত কন্ট্রোল === */}
        <TextWithImage
          imageUrl="https://gobikes.au/wp-content/uploads/2025/10/adjustable-seat-height-gobike-kids-ebike.webp"
          imageAlt="A girl in full protective gear expertly navigating a pump track on her GoBike 20."
          title="Precision Handling for the Pump Track"
          description="Dominate the rollers and berms with a bike that’s as agile as you are. The GoBike 20's fine-tuned geometry provides responsive, intuitive handling, giving riders the confidence to carve tight lines, improve their skills, and master the flow of the track."
          reverse={false} // ছবি বামে
        />

        {/* === সেকশন ৪: র‍্যাম্পের জন্য প্রস্তুত === */}
        <TextWithImage
          imageUrl="https://gobikes.au/wp-content/uploads/2025/10/gobike-au-easy-throttle-control.webp"
          imageAlt="A young boy catching significant air while jumping his GoBike 20 off a wooden ramp."
          title="Built to Fly: Ready for the Ramp"
          description="Send it! The GoBike 20 is engineered for more than just trails; it's built to handle airtime. The combination of a strong frame and responsive suspension means your young rider can confidently hit ramps and progress their skills, knowing their bike is up to the challenge."
          reverse={true} // ছবি ডানে
        />

      </div>
    </section>
  );
}