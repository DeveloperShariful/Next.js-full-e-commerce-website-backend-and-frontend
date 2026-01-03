// File: app/(storefront)/_component/OurStory.tsx
import Image from 'next/image';
import Link from 'next/link';

const OurStory = () => {
  return (
    <section className="py-12 px-2.5 font-sans">
      <div className="max-w-[1500px] mx-auto px-2.5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-20 items-center">
          <div className="w-full">
            <Image 
              loading="lazy" 
              src="https://gobikes.au/wp-content/uploads/2025/08/gobike-scaled-1.webp" 
              alt="Founders of GoBike" 
              width={2049} height={2560} 
              sizes="(max-width: 768px) 100vw, 50vw" 
              className="max-w-full h-auto block rounded-2xl"
            />
          </div>
          <div className="text-left">
            <p className="text-xl font-black text-black mb-2 uppercase tracking-wide">Our Story</p>
            <h2 className="text-4xl font-extrabold text-black mb-5 tracking-tight leading-tight">Founded by Two Dads, Fuelled by Fun GoBike</h2>
            <p className="text-[17px] text-gray-800 leading-relaxed mb-5">Welcome to GoBike! We are a proud Australian brand, founded in 2023 by two mates in the Macarthur Region of NSW. Our journey began from a simple observation: seeing the pure joy on our kids faces as they rode their first electric balance bikes.</p>
            <p className="text-[17px] text-gray-800 leading-relaxed mb-5">That spark, motivated us to design an even better <strong>kids electric bike</strong> One that elevates their riding experience while giving parents total peace of mind. We are committed to being the <strong>best electric balance bike</strong> brand through top-tier performance, reliability and unbeatable customer service.</p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg mb-8">
              <p className="m-0 text-base text-gray-800 leading-relaxed"><strong>A Splash of Fun:</strong> Every GoBike comes shipped with <strong>7 different colour sticker kits</strong>, so your child can customize their ride right out of the box!</p>
            </div>
            <Link href="/about" className="inline-block bg-black text-white px-8 py-3 rounded-full font-semibold text-base transition-transform duration-300 hover:scale-105">Read More About GoBike</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OurStory;