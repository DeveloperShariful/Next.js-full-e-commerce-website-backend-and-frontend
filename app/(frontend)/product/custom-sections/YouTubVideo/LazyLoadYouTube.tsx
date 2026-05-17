// ফাইল পাথ: app/product/components/YouTubeVideo/LazyLoadYouTube.tsx

'use client';

import { useState } from 'react';
import Image from 'next/image';

const LazyLoadYouTube = ({ videoId, title }: { videoId: string; title: string }) => {
  const [showVideo, setShowVideo] = useState(false);
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  if (showVideo) {
    return (
      <div className="relative w-full pt-[56.25%] h-0">
        <iframe
          src={embedUrl}
          title={title + " Video"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full rounded-xl"
        ></iframe>
      </div>
    );
  }

  return (
    <div 
        className="relative w-full max-w-[1200px] mx-auto pt-[56.25%] cursor-pointer overflow-hidden rounded-xl bg-black group" 
        onClick={() => setShowVideo(true)}
    >
      <Image 
        src={thumbnailUrl}
        alt={`Play button for ${title} video`}
        fill 
        style={{ objectFit: 'cover' }} 
        className="transition-transform duration-300 ease-out group-hover:scale-105 group-hover:opacity-90"
        sizes="(max-width: 768px) 100vw, 70vw" 
        priority 
      />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[68px] h-[48px] z-10 transition-transform duration-200 ease-out group-hover:scale-110">
        <svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%">
          <path 
            className="fill-[#ff0000] fill-opacity-80 transition-[fill-opacity] duration-200 ease-out group-hover:fill-opacity-100" 
            d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z"
          ></path>
          <path className="fill-white" d="M 45,24 27,14 27,34"></path>
        </svg>
      </div>
    </div>
  );
};

export default LazyLoadYouTube;