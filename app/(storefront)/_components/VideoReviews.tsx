// File: app/(storefront)/_component/VideoReviews.tsx
"use client";

import { useState, useEffect, useRef } from 'react';

interface YouTubePlayerProps { youtubeId: string; thumbnailUrl: string; }

function YouTubePlayer({ youtubeId, thumbnailUrl }: YouTubePlayerProps) {
    const [showVideo, setShowVideo] = useState(false);
    const [isIntersecting, setIntersecting] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIntersecting(true);
                    observer.unobserve(entry.target);
                }
            },
            { rootMargin: "50px" }
        );

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    if (showVideo) {
        return (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-md">
                <iframe src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`} title="YouTube video player" className="absolute top-0 left-0 w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>
        );
    }

    return (
        <div 
            ref={ref} 
            className="relative block bg-cover bg-center rounded-2xl overflow-hidden cursor-pointer shadow-md aspect-video"
            onClick={() => setShowVideo(true)} 
            style={{ 
                backgroundImage: isIntersecting ? `url('${thumbnailUrl}')` : 'none',
                backgroundColor: isIntersecting ? 'transparent' : '#e0e0e0'
            }}
        >
            <div className="absolute inset-0 bg-black/20"></div>
            {isIntersecting && (
                <div className="w-20 h-14 bg-black/70 rounded-xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform duration-200 hover:scale-110 hover:bg-red-600/80">
                    <div className="w-0 h-0 border-y-[12px] border-y-transparent border-l-[20px] border-l-white ml-1"></div>
                </div>
            )}
        </div>
    );
}

const VideoReviews = () => {
    const sliderRef = useRef<HTMLDivElement>(null);

    const videoData = [
        {
            youtubeId: "Fl8jEUxS_LU", 
            thumbnailUrl: "https://i.ytimg.com/vi/Fl8jEUxS_LU/maxresdefault.jpg",
            title: "Unboxing & First Ride: The GoBike 12 Experience",
            description: "From first rides to pro-level tricks, our video reviews showcase the real-world performance and unbeatable fun of our kids electric bikes. See them in action!"
        },
        {
            youtubeId: "BARebHNa3lY",
            thumbnailUrl: "https://i.ytimg.com/vi/BARebHNa3lY/maxresdefault.jpg",
            title: "GoBike 16: From Parks to Trails",
            description: "A deep-dive review showing the GoBike 16 versatility and power on different terrains."
        },
        {
            youtubeId: "CIevuTbyTlY",
            thumbnailUrl: "https://i.ytimg.com/vi/CIevuTbyTlY/maxresdefault.jpg",
            title: "Parents Guide: Choosing The Right GoBike",
            description: "Confused between models? This helpful guide breaks down the features of each GoBike."
        },
    ];

    const scroll = (direction: 'left' | 'right') => {
        if (sliderRef.current) {
            const { current } = sliderRef;
            const slideWidth = current.children[0].clientWidth + 30; // 30px is the gap
            const scrollAmount = direction === 'left' ? -slideWidth : slideWidth;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section className="bg-gray-50 py-12 px-2.5 font-sans">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">See Why Parents & Kids Love The GoBike</h2>
                <p className="text-lg text-gray-900 max-w-3xl mx-auto leading-relaxed">From first rides to pro-level tricks, our video reviews showcase the real-world performance and unbeatable fun of our kids electric bikes. See them in action!</p>
            </div>
            
            <div className="max-w-[1500px] mx-auto px-0.5 relative">
                <div 
                    className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-8 pb-4" 
                    ref={sliderRef}
                    style={{ scrollbarWidth: 'none' }}
                >
                    {videoData.map((video, index) => (
                        <div className="flex-shrink-0 w-[95%] md:w-[48%] snap-start box-border" key={index}>
                            <YouTubePlayer youtubeId={video.youtubeId} thumbnailUrl={video.thumbnailUrl} />
                            <div className="mt-6 text-center">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{video.title}</h3>
                                <p className="text-base text-black m-0 leading-relaxed max-w-xl mx-auto">{video.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                
                <button onClick={() => scroll('left')} className="absolute top-[40%] -translate-y-1/2 -left-1 w-11 h-11 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors z-10" aria-label="Previous video">&#10094;</button>
                <button onClick={() => scroll('right')} className="absolute top-[40%] -translate-y-1/2 -right-1 w-11 h-11 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors z-10" aria-label="Next video">&#10095;</button>
            </div>
        </section>
    );
}

export default VideoReviews;