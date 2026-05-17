// app/product/custom-sections/TextWithImage.tsx

import Image from 'next/image';

interface TextWithImageProps {
  imageUrl: string;
  imageAlt: string;
  title: string;
  description: string;
  reverse?: boolean; 
}

export default function TextWithImage({ 
  imageUrl, 
  imageAlt, 
  title, 
  description, 
  reverse = false 
}: TextWithImageProps) {
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 md:gap-12 w-full max-w-[1200px] mx-auto">
      <div className={`w-full order-1 ${reverse ? 'md:order-2' : 'md:order-1'}`}>
        <div className="relative w-full pt-[75%] rounded-xl overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.1)]">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
      <div className={`w-full flex flex-col justify-center text-center md:text-left order-2 ${reverse ? 'md:order-1' : 'md:order-2'}`}>
        <h2 className="text-[2rem] md:text-[2.5rem] font-bold mb-4 text-[#1a202c] leading-[1.2]">{title}</h2>
        <p className="text-[1rem] md:text-[1.1rem] text-[#4a5568] leading-[1.7] m-0">{description}</p>
      </div>

    </div>
  );
}