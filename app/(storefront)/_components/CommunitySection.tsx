// File: app/(storefront)/_component/CommunitySection.tsx
import Image from 'next/image';
import Link from 'next/link';

const CommunitySection = () => {
  return (
    <section className="bg-gray-50 py-12 px-2.5 font-sans">
      <div className="max-w-[1450px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-20 items-center p-2.5">
          <div className="w-full">
            <Image 
              loading="lazy" 
              src="https://gobikes.au/wp-content/uploads/2025/08/electric-bike-ebike-for-kids-1.webp" 
              alt="GoBike community" 
              width={2199} height={2560} 
              sizes="(max-width: 768px) 100vw, 50vw" 
              className="max-w-full h-auto block rounded-2xl"
            />
          </div>
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-black mb-5 leading-tight tracking-tight">More Than a Bike - It is The GoBike Family</h2>
            <p className="text-[17px] text-gray-800 leading-relaxed mb-6 text-left">At GoBike, our passion is creating unforgettable riding experiences. We did not just set out to sell another kids ebike, we aimed to design the <strong>best electric bike for kids</strong> in Australia, ensuring a fun-filled adventure for them and a stress-free experience for parents.</p>
            <p className="text-[17px] text-gray-800 leading-relaxed mb-6 text-left">Every <strong>electric balance bike</strong> we create is a blend of fun, reliability, and safety. By choosing GoBike, you’re not just getting a top-quality <strong>kids electric motorbike</strong>; you’re joining a community that values adventure and family bonding.</p>
            <p className="text-lg text-black font-semibold mb-8 text-center lg:text-left">Create lasting memories and join the adventure today!</p>
            <Link href="/bikes" className="inline-block bg-black text-white px-9 py-3.5 rounded-full font-bold text-base border-2 border-transparent transition-all duration-300 hover:bg-white hover:text-black hover:border-black">Join The Community</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CommunitySection;