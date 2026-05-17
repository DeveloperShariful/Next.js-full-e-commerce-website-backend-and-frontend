// components/HomePageReviews.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaStar, FaTimes, FaPlayCircle } from 'react-icons/fa';
import { getHomePageReviewsAction } from '@/app/actions/frontend/home/getHomePageReviewsAction';

// --- Types ---
interface ReviewSummary {
  review_count: number;
  average_rating: number;
  rating_counts: { rating: number; count: number; }[];
}

interface ReviewMedia {
  url: string;
  type: string;
}

interface Review {
  id: string | number; 
  reviewer: string;
  review: string;
  rating: number;
  date: string;
  product_name: string;
  product_permalink: string;
  product_image?: string;
  review_media?: ReviewMedia[];
}

// --- স্টার রেটিং কম্পোনেন্ট ---
const StarRating = ({ rating, size = 1, alignLeft = false }: { rating: number, size?: number, alignLeft?: boolean }) => {
    const totalStars = 5;
    const fullStars = Math.floor(rating);
    const emptyStars = totalStars - fullStars;
    return (
        <div 
            className={`flex gap-1 text-black mt-[0.1rem] ${alignLeft ? 'justify-start' : 'justify-center'}`} 
            style={{ fontSize: `${size}rem` }}
        >
            {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} color="#ffc107" />)}
            {[...Array(emptyStars)].map((_, i) => <FaStar key={`empty-${i}`} className="text-[#e4e5e9]" />)}
        </div>
    );
};

// --- মূল রিভিউ সেকশন কম্পোনেন্ট ---
export default function HomePageReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleReviews, setVisibleReviews] = useState(3);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMedia, setActiveMedia] = useState<ReviewMedia | null>(null);
  
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchReviewsData() {
      try {
        setLoading(true);
        const response = await getHomePageReviewsAction();

        if (response.success && response.data && isMounted) {
            setReviews(response.data.reviews);
            setSummary(response.data.summary);
        }
      } catch (error) {
        console.error("Error fetching reviews data:", error);
      } finally {
        if (isMounted) {
            setLoading(false);
        }
      }
    }
    fetchReviewsData();

    return () => {
        isMounted = false;
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
      if (sliderRef.current) {
          const { current } = sliderRef;
          const scrollAmount = direction === 'left' 
              ? -(current.offsetWidth * 0.9) 
              : (current.offsetWidth * 0.9);
          
          current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
  };

  const openModal = (media: ReviewMedia) => {
    setActiveMedia(media);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; 
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveMedia(null);
    document.body.style.overflow = 'auto'; 
  };

  if (loading) {
    return (
        <section className="pb-12 bg-white">
            <div className="max-w-[1500px] mx-auto px-4">
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            </div>
        </section>
    );
  }

  if (reviews.length === 0) {
    return null;
  }
  
  const ratingPercentages = summary?.rating_counts.map(item =>
    summary.review_count > 0 ? (item.count / summary.review_count) * 100 : 0
  );

  return (
    <section className="pb-12 bg-white font-sans">
      <div className="max-w-[1500px] mx-auto px-4">
        
        <div className="text-center mb-12 mt-4">
          <h2 className="text-[1.7rem] md:text-[2rem] font-extrabold mb-2 tracking-tight text-[#1a1a1a]">
            What our customers are saying about Gobike
          </h2>
        </div>

        {summary && summary.review_count > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-y-8 gap-x-12 items-center p-6 lg:p-10 bg-[#f8f9fa] rounded-[20px] mb-16 border border-[#e7e7e7]">
              
              <div className="text-center pr-0 lg:pr-12 border-b lg:border-b-0 lg:border-r border-[#e0e0e0] pb-8 lg:pb-0">
                  <div className="text-[4rem] font-extrabold leading-none text-black">{summary.average_rating.toFixed(1)}</div>
                  <StarRating rating={summary.average_rating} size={1.2} />
                  <div className="text-[0.9rem] text-[#555] mt-4">Based on {summary.review_count} reviews</div>
              </div>
              
              <div className="flex flex-col gap-3 w-full">
                  {ratingPercentages?.map((percent, index) => (
                      <div className="flex items-center gap-4 text-[0.9rem] text-[#555]" key={5 - index}>
                          <span className="w-[50px]">{5 - index} star</span>
                          <div className="flex-grow h-2 bg-[#e9ecef] rounded overflow-hidden">
                              <div className="h-full bg-[#f5b327]" style={{ width: `${percent}%` }}></div>
                          </div>
                          <span>{Math.round(percent)}%</span>
                      </div>
                  ))}
              </div>
              
              <div className="text-center pl-0 lg:pl-12 border-t lg:border-t-0 lg:border-l border-[#e0e0e0] pt-8 lg:pt-0">
                  <span className="inline-block bg-[#1a1a1a] text-white border-none py-[0.9rem] px-8 rounded-lg cursor-pointer font-semibold transition-colors duration-200 hover:bg-[#333]">
                    Add a review
                  </span>
              </div>
          </div>
        )}

        <div className="relative">
            <div 
                className="
                    grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-8 
                    md:overflow-visible
                    max-md:flex max-md:overflow-x-auto max-md:snap-x max-md:snap-mandatory max-md:scrollbar-none max-md:gap-4 max-md:-mx-4 max-md:px-4 max-md:pb-4
                " 
                ref={sliderRef}
            >
            {reviews.slice(0, visibleReviews).map((review) => {
                const productSlug = review.product_permalink.split('/').filter(Boolean).pop() || '';
                return (
                    <div 
                        key={review.id} 
                        className="
                            bg-[#f8f9fa] rounded-2xl p-6 border border-[#e7e7e7] flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)]
                            max-md:flex-none max-md:w-[90%] max-md:snap-start
                        "
                    >
                        <div className="flex items-center mb-4 gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#e9ecef] text-[#333] flex items-center justify-center font-bold text-[1.1rem] flex-shrink-0 relative after:content-['✓'] after:absolute after:-bottom-0.5 after:-right-0.5 after:bg-emerald-500 after:text-white after:w-4 after:h-4 after:rounded-full after:border-2 after:border-white after:flex after:items-center after:justify-center after:text-[8px] after:font-bold">
                                {review.reviewer.substring(0, 1)}
                            </div>
                            <div className="flex flex-col items-start">
                                <strong className="font-semibold text-base">{review.reviewer}</strong>
                                <span className="text-[0.8rem] text-emerald-500 font-medium">Verified review</span>
                            </div>
                        </div>

                        <StarRating rating={review.rating} alignLeft={true} />
                        
                        <div 
                            className="text-[#333] leading-[1.6] text-[0.95rem] mb-4 flex-grow [&>p:last-child]:mb-0"
                            dangerouslySetInnerHTML={{ __html: review.review }}
                        />

                        {review.review_media && review.review_media.length > 0 && (
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200">
                                {review.review_media.map((media, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => openModal(media)}
                                        className="relative w-[70px] h-[70px] flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border border-gray-200 transition-opacity hover:opacity-80"
                                    >
                                        {media.type === "video" ? (
                                            <>
                                                <video src={media.url} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                    <FaPlayCircle className="text-white text-2xl opacity-80" />
                                                </div>
                                            </>
                                        ) : (
                                            <Image src={media.url} alt="Review Media" fill className="object-cover" sizes="70px" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-3 text-[0.9rem] text-[#555] mt-auto pt-4 border-t border-[#e9ecef]">
                            {review.product_image && (
                                <Link href={`/product/${productSlug}`}>
                                    <div className="relative w-10 h-10 flex-shrink-0">
                                        <Image src={review.product_image} alt={review.product_name} fill className="rounded-md object-cover" sizes="40px" />
                                    </div>
                                </Link>
                            )}
                            <span>on <Link href={`/product/${productSlug}`} className="text-[#1a1a1a] font-semibold hover:underline line-clamp-1">{review.product_name}</Link></span>
                        </div>
                    </div>
                );
            })}
            </div>

            <button 
                onClick={() => scroll('left')} 
                className="md:hidden absolute top-1/2 -translate-y-1/2 left-0 bg-black/50 text-white border-none rounded-full w-10 h-10 text-lg cursor-pointer z-10 transition-colors duration-300 flex items-center justify-center hover:bg-black/80"
                aria-label="Previous review"
            >
                &#10094;
            </button>
            <button 
                onClick={() => scroll('right')} 
                className="md:hidden absolute top-1/2 -translate-y-1/2 right-0 bg-black/50 text-white border-none rounded-full w-10 h-10 text-lg cursor-pointer z-10 transition-colors duration-300 flex items-center justify-center hover:bg-black/80"
                aria-label="Next review"
            >
                &#10095;
            </button>
        </div>
        
        {reviews.length > visibleReviews && (
            <div className="text-center mt-12">
                <button 
                    onClick={() => setVisibleReviews(reviews.length)} 
                    className="bg-transparent border border-[#ccc] py-[0.8rem] px-10 rounded-lg cursor-pointer font-semibold text-base text-[#1a1a1a] transition-all duration-200 hover:bg-[#f0f0f0] hover:border-[#aaa]"
                >
                    Show more reviews ({reviews.length - visibleReviews} more)
                </button>
            </div>
        )}

      </div>

      {isModalOpen && activeMedia && (
        <div 
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={closeModal}
        >
            <button 
                className="absolute top-6 right-6 text-white text-3xl hover:text-gray-300 transition-colors cursor-pointer z-[10000]"
                onClick={closeModal}
                aria-label="Close"
            >
                <FaTimes />
            </button>
            
            <div 
                className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()} 
            >
                {activeMedia.type === "video" ? (
                    <video src={activeMedia.url} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg shadow-2xl outline-none" />
                ) : (
                    <img src={activeMedia.url} alt="Expanded Review Media" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl select-none" />
                )}
            </div>
        </div>
      )}

    </section>
  );
}