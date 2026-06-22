// app/(frontend)/HomePageClient.tsx
"use client";
import Image from 'next/image';
import FeaturedBikes from '../../components/FeaturedBikes';
import Link from 'next/link';
import { useState, useEffect, useRef, ReactNode } from 'react';
import HomePageReviews from '../../components/HomePageReviews';

// ====================================================================
// Performance Optimization: Lazy Load Wrapper
// ====================================================================

const LazyLoadSection = ({ children }: { children: ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); 
        }
      },
      {
        rootMargin: "300px",
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} style={{ minHeight: '100px' }}>
      {isVisible ? children : null}
    </div>
  );
};

// ====================================================================
// Shared Components / Icons
// ====================================================================
const ReturnIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 1-9 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/><path d="M21 12v3a2 2 0 0 1-2 2H5"/><path d="m16 5 3-3-3-3"/><path d="M3 10h13"/><path d="M12 21a9 9 0 0 0 9-9h-3"/><path d="m16 19 3 3-3 3"/></svg>;
const WarrantyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>;
const SecureIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const PerformanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.5l.3-.3a1.5 1.5 0 0 1 2.4 2l-3.2 3.2-1.3-1.3a1.5 1.5 0 0 1 2-2.3zM8.5 10.5l-1.3-1.3a1.5 1.5 0 0 1 2-2.3l.3-.3a1.5 1.5 0 0 1 2.4 2l-3.2 3.2z"/><path d="M12 15.5l.3-.3a1.5 1.5 0 0 1 2.4 2l-3.2 3.2-1.3-1.3a1.5 1.5 0 0 1 2-2.3zM8.5 14.5l-1.3-1.3a1.5 1.5 0 0 1 2-2.3l.3-.3a1.5 1.5 0 0 1 2.4 2l-3.2 3.2z"/><path d="M15.5 12.5l-.3.3a1.5 1.5 0 0 1-2.4-2l3.2-3.2 1.3 1.3a1.5 1.5 0 0 1-2 2.3z"/><path d="M10.5 8.5l1.3 1.3a1.5 1.5 0 0 1-2 2.3l-.3.3a1.5 1.5 0 0 1-2.4-2l3.2-3.2z"/><path d="M19 12h-2"/><path d="M5 12H3"/></svg>;
const ShippingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16.5V8a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v2M18 16.5v-3.5a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v1.5M6 12v6h2l2-3-2-3H6"/><path d="M3 12h3"/><path d="M21 12h-3"/></svg>;
const SupportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M22 11h-4"/></svg>;

const TickMark = () => <span className="text-red-600 font-bold text-xl">✓</span>;
const CrossMark = () => <span className="text-black font-bold text-xl">✕</span>;

// ====================================================================
// HeroSlider Component (Upgraded & Optimized)
// ====================================================================
const slidesData =[
  {
    subtitle: "The Extreme Machine",
    title: "GOBIKE 24",
    desc: "The ultimate electric dirt bike for teens and adults aged 12+. Unleash raw power with a massive 2500W motor hitting top speeds of 61km/h. Featuring fully adjustable hydraulic suspension and 24-inch Kenda fat tires.",
    link: "/product/gobike-24-inch-electric-bike-for-teens-high-speed-performance-for-ages-13",
    img: "https://gobikes.au/wp-content/uploads/2025/12/Slider-1-scaled.webp",
    alt: "GoBike 24 Inch Electric Dirt Bike",
    width: 1000, height: 774
  },
  {
    subtitle: "The Ultimate Weapon",
    title: "GOBIKE 20",
    desc: "The best 20-inch kids electric bike on the market. Built tough for young adventurers and teens, it delivers powerful performance, long battery life with a 10Ah battery, and reliable fun every ride.",
    link: "/product/gobike-20-inch-electric-bike-for-kids-teens-for-ages-8-14",
    img: "https://gobikes.au/wp-content/uploads/2025/08/Gobike-electric-bike-kids-ebike20-inch-ages-for10-16-1-1.webp",
    alt: "GoBike 20 Electric Bike",
    width: 1000, height: 774
  },
  {
    subtitle: "The All-Rounder",
    title: "GOBIKE 16",
    desc: "The fastest 16-inch kids electric bike on the market! Designed for confident young riders. Three speed modes, hydraulic disc brakes, and front suspension.",
    link: "/product/gobike-16-inch-electric-bike-for-kids-riding-fun-for-ages-5-9",
    img: "https://gobikes.au/wp-content/uploads/2025/08/Gobike-electric-bike-kids-ebike20-inch-ages-for10-16-2.webp",
    alt: "GoBike 16 Electric Bike",
    width: 1000, height: 849
  },
  {
    subtitle: "The Everyday GoBike Range",
    title: "GOBIKE 12",
    desc: "The perfect first electric bike for toddlers aged 2 years and above transitioning from a balance bike. Features an extra-slow learning mode for beginners.",
    link: "https://www.sharifulbuilds.com/product/ebike-for-kids-12-inch-electric-bike-ages-2-5",
    img: "https://gobikes.au/wp-content/uploads/2025/08/Gobike-electric-bike-kids-ebike12-inch-ages-for-2-5-1.webp",
    alt: "GoBike 12 Electric Bike",
    width: 1000, height: 803
  }
];

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const[touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    if (isPaused) return;
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slidesData.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(slideInterval);
  }, [isPaused]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === slidesData.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slidesData.length - 1 : prev - 1));
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) nextSlide(); 
    if (touchStart - touchEnd < -75) prevSlide(); 
  };

  return (
    <section 
      className="bg-black relative w-full overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button 
        onClick={prevSlide}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/30 backdrop-blur-sm rounded-full items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
        aria-label="Previous Slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      <button 
        onClick={nextSlide}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/30 backdrop-blur-sm rounded-full items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
        aria-label="Next Slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>
      <div 
        className="flex transition-transform duration-700 ease-in-out w-full" 
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slidesData.map((slide, index) => (
          <div key={index} className="min-w-full box-border text-white flex flex-col lg:flex-row lg:h-[70vh] lg:min-h-[550px] relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent z-0 hidden lg:block" />
            <div className="w-full lg:w-[55%] order-1 lg:order-2 flex items-center justify-center relative z-10 px-5 lg:px-0">
              <Image 
                className="w-full h-auto max-h-[350px] lg:max-h-full object-contain transition-transform duration-700 hover:scale-105" 
                loading={index === 0 ? "eager" : "lazy"}
                src={slide.img} 
                alt={slide.alt} 
                width={slide.width} 
                height={slide.height} 
                priority={index === 0} 
                sizes="(max-width: 768px) 100vw, 50vw" 
              />
            </div>
            <div className="w-full lg:w-[45%] order-2 lg:order-1 p-8 lg:p-[60px] flex flex-col justify-center text-center lg:text-left lg:items-start relative z-10">
              <p className={`text-sm font-semibold uppercase tracking-[2px] mb-3 text-white-500 transition-all duration-700 delay-100 ${currentSlide === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {slide.subtitle}
              </p>
              <p className={`text-white text-[42px] lg:text-[56px] font-extrabold mb-5 leading-[1.1] transition-all duration-700 delay-200 ${currentSlide === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {slide.title}
              </p>
              <p className={`text-lg leading-[1.6] mb-8 text-gray-300 max-w-[480px] lg:max-w-none mx-auto lg:mx-0 transition-all duration-700 delay-300 ${currentSlide === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {slide.desc}
              </p>
              <div className={`transition-all duration-700 delay-500 ${currentSlide === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <Link href={slide.link} className="inline-flex items-center gap-2 bg-white text-black py-3.5 px-9 rounded-full font-bold text-base transition-all duration-300 hover:bg-red-500 hover:text-white hover:shadow-lg hover:-translate-y-1">
                  Shop Now
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              </div>
            </div>

          </div>
        ))}
      </div>
      <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 z-20 flex gap-2.5 lg:left-[22.5%] lg:transform-none">
        {slidesData.map((_, index) => (
          <button 
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2.5 rounded-full transition-all duration-500 ${
              currentSlide === index 
                ? 'bg-red-500 w-8 shadow-[0_0_10px_rgba(239,68,68,0.8)]' 
                : 'bg-white/40 w-2.5 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
// ====================================================================
// TrustBadges Component
// ====================================================================
const trustItems = [
    { icon: <ReturnIcon />, title: "Easy 30-Day Returns", description: "Not a perfect fit? No worries. We offer a 30-day money-back guarantee." },
    { icon: <WarrantyIcon />, title: "Full 1-Year Warranty", description: "Every GoBike kids electric bike is covered by a full one-year local warranty." },
    { icon: <SecureIcon />, title: "100% Secure Checkout", description: "Pay with confidence. We support all major payment methods including Afterpay." },
    { icon: <PerformanceIcon />, title: "Market-Leading Performance", description: "Experience the highest top speeds and best performance for value on any kids ebike." },
    { icon: <ShippingIcon />, title: "Fast Shipping Aus-Wide", description: "Get your GoBike delivered quickly to your doorstep, anywhere in Australia." },
    { icon: <SupportIcon />, title: "Expert Aussie Support", description: "Have a question? email us easily! gobike@gobike.au our local team is ready to help you." },
];

const TrustBadges = () => {
  return (
    <section className="py-12 px-2.5 font-sans">
      <div className="max-w-[1500px] mx-auto px-2.5">
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-bold text-[#1a1a1a] mb-3 tracking-tight">The GoBike Promise: Australias Best Kids Electric Bike</h1>
          <p className="text-lg text-[#666] max-w-[800px] mx-auto leading-[1.5]">We are committed to providing an unmatched riding experience, backed by guarantees you can count on. Here’s why GoBike is the choice for Aussie families. Electric balance bike</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[30px] gap-y-[40px]">
          {trustItems.map((item, index) => (
            <div className="flex items-start gap-4" key={index}>
              <div className="flex-shrink-0 w-8 h-8">{item.icon}</div>
              <div>
                <h3 className="text-base font-bold text-[#1a1a1a] mb-1.5">{item.title}</h3>
                <p className="text-[15px] text-[#666] m-0 leading-[1.6]">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ====================================================================
// ProductCollection Component
// ====================================================================
const products = [
    { 
      imgSrc: "https://gobikes.au/wp-content/uploads/2025/10/Electric-Balance-Bike-Electric-bike-Balance-Bike-Bike-baby-bike-E-bike-scaled.webp", 
      altText: "GoBike 12 Kids Electric Balance Bike with 3 speed modes", 
      name: "GoBike 12-inch", 
      feature: "Perfect for Ages 2-5 | Featuring a Slow Safety Mode for new riders.", 
      link: "product/ebike-for-kids-12-inch-electric-bike-ages-2-5" 
    },
    { 
      imgSrc: "https://gobikes.au/wp-content/uploads/2025/08/Gobike-kids-electric-bike-ebike-for-kids-1-scaled-1.webp", 
      altText: "GoBike 16 Kids Electric Bike with 3 speed modes", 
      name: "GoBike 16-inch", 
      feature: "Best for Ages 5-9 | With 3-Speed Modes, Dual Hydraulic Brakes and Front Suspension.", 
      link: "product/gobike-16-inch-electric-bike-for-kids-riding-fun-for-ages-5-9" 
    },
    { 
      imgSrc: "https://rgy4iw8lybyokbyt.public.blob.vercel-storage.com/GoBike%2020%20All-Terrain%20Kids%20Electric%20Bike-VjbYiNh19Dw9o3ZlSgPMSJmqtdI6vL.webp", 
      altText: "GoBike 20 All-Terrain Kids Electric Bike", 
      name: "GoBike 20-inch", 
      feature: "Serious Bike for Ages 8-14 | A powerful and reliable bike for the bigger kids.", 
      link: "product/gobike-20-inch-electric-bike-for-kids-teens-for-ages-8-14" 
    },
    // নতুন GoBike 24-inch লিংক থেকে পাওয়া তথ্যের ভিত্তিতে যোগ করা হলো
    { 
      imgSrc: "https://rgy4iw8lybyokbyt.public.blob.vercel-storage.com/GoBike%2024-inch%20Electric%20Bike%20for%20Teens%20and%20adult-twug31TuTZNZYI9sQtfLqjXu3MHgKU.webp", // <-- ওয়েবসাইট থেকে 24-inch এর ছবির লিংকটি কপি করে শুধু এখানে বসিয়ে দিন
      altText: "GoBike 24-inch Electric Bike for Teens", 
      name: "GoBike 24-inch", 
      feature: "Perfect for Ages 13+ | High-Speed Performance Electric Bike for Teens and adults.", 
      link: "product/gobike-24-inch-electric-bike-for-teens-high-speed-performance-for-ages-13" 
    }
];

const ProductCollection = () => {
  return (
    <section className="py-5">
      <div className="max-w-[1500px] mx-auto px-2.5">
        <h2 className="text-center text-[30px] font-bold text-[#1a1a1a] mb-5">The GoBike Electric Bike Latest Collection</h2>
        
        {/* ৪টি আইটেম সুন্দরভাবে দেখানোর জন্য lg:grid-cols-4 দেওয়া হয়েছে */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[30px]">
          {products.map((product, index) => (
            <Link href={product.link} className="text-center border border-[#e9e9e9] rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-lg flex flex-col justify-between no-underline text-inherit" key={index}>
              <div className="bg-[#f7f7f7] p-1.5">
                <Image loading="lazy" src={product.imgSrc} alt={product.altText} width={2560} height={1850} sizes="(max-width: 768px) 100vw, 33vw" className="w-full h-auto aspect-square object-cover rounded-[5px]"/>
              </div>
              <div className="p-1.5 flex flex-col flex-grow">
                <h3 className="text-[20px] font-bold text-[#1a1a1a] m-0">{product.name}</h3>
                <p className="text-[17px] font-semibold text-black my-2.5 flex-grow">{product.feature}</p>
                <div className="text-[18px] font-bold text-[#1a1a1a] mb-4"></div>
                <span className="inline-block bg-black text-white py-3 px-5 rounded-[5px] font-semibold transition-colors duration-300 hover:bg-[#333]">View Details</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/bikes" className="inline-block bg-black text-white py-3.5 px-9 rounded-full font-bold text-base border-2 border-transparent transition-all duration-300 hover:bg-white hover:text-black hover:border-black">View All Bikes</Link>
        </div>
      </div>
    </section>
  );
}


// ====================================================================
// OurStory Component
// ====================================================================
const OurStory = () => {
  return (
    <section className="py-12 px-2.5 font-sans">
      <div className="max-w-[1500px] mx-auto px-2.5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-20 items-center">
          <div className="w-full">
            <Image loading="lazy" src="https://gobikes.au/wp-content/uploads/2025/08/gobike-scaled-1.webp" alt="Two Australian dads with their kids and electric balance bikes" width={2049} height={2560} sizes="(max-width: 768px) 100vw, 50vw" className="w-full h-auto block rounded-2xl" />
          </div>
          <div className="text-left">
            <p className="text-[20px] font-black text-black mb-2.5 uppercase tracking-[1px]">Our Story</p>
            <h2 className="text-[34px] font-extrabold text-black mb-5 tracking-tight leading-[1.2]">Founded by Two Dads, Fuelled by Fun GoBike</h2>
            <p className="text-[17px] text-[#333] leading-[1.8] mb-5">Welcome to GoBike! We are a proud Australian brand, founded in 2023 by two mates in the Macarthur Region of NSW. Our journey began from a simple observation: seeing the pure joy on our kids faces as they rode their first electric balance bikes.</p>
            <p className="text-[17px] text-[#333] leading-[1.8] mb-5">That spark, motivated us to design an even better <strong>kids electric bike</strong> One that elevates their riding experience while giving parents total peace of mind. We are committed to being the <strong>best electric balance bike</strong> brand through top-tier performance, reliability and unbeatable customer service.</p>
            <div className="bg-[#f0f8ff] border-l-4 border-[#007bff] p-5 rounded-r-lg mb-8">
              <p className="m-0 text-base text-[#333] leading-[1.6]"><strong>A Splash of Fun:</strong> Every GoBike comes shipped with <strong>7 different colour sticker kits</strong>, so your child can customize their ride right out of the box!</p>
            </div>
            <Link href="/about" className="inline-block bg-black text-white py-3 px-8 rounded-full font-semibold text-base transition-transform duration-300 hover:scale-105 no-underline">Read More About GoBike</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ====================================================================
// SmarterChoice Component
// ====================================================================
const choices = [
    { 
      imageSrc: "https://gobikes.au/wp-content/uploads/2025/08/Gobike-kids-electric-bikes-electric-bike-for-kids-ebike-kids-electric-bike-Final-1.webp", 
      width: 1500, height: 1200,
      label: "A child wearing a helmet", 
      title: "Safety is Our Foundation", 
      description: "From a gentle, slow-start mode for beginners to responsive, powerful brakes for confident riders, every detail is engineered to keep your child safe on their adventures." 
    },
    { 
      imageSrc: "https://gobikes.au/wp-content/uploads/2025/02/Electric-Balance-Bike-Electric-bike-Balance-Bike-Bike-baby-bike-E-bike-Electric-bike-E-bike-review-Electric-bike-review-Buy-e-bike-Buy-electric-bike-E-bike-price-Electric-bike-price-E-b-scaled-2.webp", 
      width: 2560, height: 1706,
      label: "A tough GoBike frame", 
      title: "Built for Real Kids", 
      description: "Kids play hard. We get it. That's why GoBikes are built with durable, high-quality frames and components that can handle bumps, skids, and years of relentless fun."
    },
    { 
      imageSrc: "https://gobikes.au/wp-content/uploads/2025/02/Electric-Balance-Bike-Electric-bike-Balance-Bike-Bike-baby-bike-E-bike-Electric-bike-E-bike-review-Electric-bike-review-Buy-e-bike-Buy-electric-bike-E-bike-price-Electric-bike-price-E-b-1-1-2.webp", 
      width: 1941, height: 1294,
      label: "A GoBike battery", 
      title: "More Riding, Less Waiting", 
      description: "Our high-efficiency batteries offer the longest run-times available, so the adventure doesn't have to stop. More time on the bike, less time plugged into the wall."
    },
    { 
      imageSrc: "https://gobikes.au/wp-content/uploads/2025/02/Electric-Balance-Bike-Electric-bike-Balance-Bike-scaled-1.webp", 
      width: 1920, height: 1370,
      label: "The Australian flag", 
      title: "Aussie Owned & Supported", 
      description: "We're not just a store, we're a team of Aussie parents right here to help. When you need support, you'll get real advice from people who actually use and love the product."
    }
];

const SmarterChoice = () => {
    const sliderRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (sliderRef.current) {
            const { current } = sliderRef;
            const scrollAmount = direction === 'left' 
                ? -(current.offsetWidth * 0.9) 
                : (current.offsetWidth * 0.9);
            
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

  return (
    <section className="py-12 px-2.5 font-sans w-full ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]">
      <div className="max-w-[1500px] mx-auto px-2.5">
        <div className="text-center mb-8">
          <h2 className="text-[32px] font-bold text-[#1a1a1a] mb-3 tracking-tight">Why GoBike is The Smarter Choice</h2>
          <p className="text-lg text-black max-w-[800px] mx-auto leading-[1.5]">When we could not find the best kids electric bike for our own kids, we decided to build it. Every GoBike is a promise of, durability, performance and pure FUN.</p>
        </div>

        <div className="relative px-2.5">
            {/* Grid / Slider */}
            <div className="flex lg:grid overflow-x-auto lg:overflow-visible snap-x snap-mandatory scrollbar-none gap-6 lg:grid-cols-4 pb-2.5 lg:pb-0" ref={sliderRef}>
                {choices.map((choice, index) => (
                    <div className="flex-none w-[90%] lg:w-auto snap-start border border-[#e9e9e9] rounded-xl overflow-hidden bg-[#f8f9fa] flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-lg" key={index}>
                        <div className="relative w-full bg-[#e0e0e0]">
                            <Image
                                src={choice.imageSrc}
                                alt={choice.label}
                                width={choice.width}
                                height={choice.height}
                                sizes="(max-width: 767px) 90vw, (max-width: 992px) 50vw, 25vw"
                                style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
                            />
                        </div>
                        <div className="p-6 flex-grow">
                            <h3 className="text-[1.3rem] font-bold mb-3">{choice.title}</h3>
                            <p className="text-base text-[#444] leading-[1.6]">{choice.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Buttons (Visible mostly on Mobile via CSS) */}
            <button onClick={() => scroll('left')} className="md:hidden flex absolute top-[35%] -translate-y-1/2 left-[-5px] bg-black/60 text-white border-none rounded-full w-[45px] h-[45px] text-xl cursor-pointer z-10 transition-colors hover:bg-black/90 items-center justify-center" aria-label="Previous choice">&#10094;</button>
            <button onClick={() => scroll('right')} className="md:hidden flex absolute top-[35%] -translate-y-1/2 right-[-5px] bg-black/60 text-white border-none rounded-full w-[45px] h-[45px] text-xl cursor-pointer z-10 transition-colors hover:bg-black/90 items-center justify-center" aria-label="Next choice">&#10095;</button>
        </div>

      </div>
    </section>
  );
}

// ====================================================================
// DifferenceSection Component
// ====================================================================
const comparisonData = [
    { feature: "Long Run Time", isGoBike: true, isOthers: false }, { feature: "High Speed / Performance", isGoBike: true, isOthers: false }, { feature: "Slow Learning Mode", isGoBike: true, isOthers: false }, { feature: "Affordability", isGoBike: true, isOthers: false }, { feature: "Most Reliable", isGoBike: true, isOthers: false }, { feature: "Easy Spare Parts", isGoBike: true, isOthers: false }, { feature: "Best Support And Service", isGoBike: true, isOthers: false },
];

const DifferenceSection = () => {
  return (
    <section className="py-12 px-2.5 font-sans bg-black text-white">
      <div className="max-w-[1450px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div className="text-left">
            <h2 className="text-[32px] font-bold text-white mb-3 tracking-tight text-center">The GoBike Difference</h2>
            <h3 className="text-[18px] text-white mt-0 max-w-[800px] mx-auto leading-[1.5] text-center font-semibold mb-3">Engineered Better. Built Stronger.</h3>
            <p className="text-[17px] leading-[1.7] mb-5">While others cut corners, we deliver what matters: the <strong>highest-performance and most reliable kids electric bike</strong> on the market, backed by a <strong>1-year advanced replacement warranty.</strong></p>
            <p className="text-[17px] leading-[1.7] mb-0">As a proud Aussie brand founded by two dads, we built the bikes we wanted for our own kids. That is the GoBike promise.</p>
          </div>
          <div>
            <table className="w-full border-collapse bg-white rounded-2xl overflow-hidden shadow-[0_15px_30px_rgba(255,255,255,0.1)]">
              <thead>
                <tr>
                  <th className="bg-transparent border-b border-[#101010] p-1 md:p-4"></th>
                  <th className="border-b border-[#101010] p-1 md:p-4">
                    <Image src="https://gobikes.au/wp-content/uploads/2025/06/GOBIKE-Electric-Bike-for-kids-1.webp" width={1880} height={410} alt="GoBike Logo" className="max-h-[40px] inline-block w-auto" />
                  </th>
                  <th className="text-black border-b border-[#101010] p-1 md:p-4 text-base font-semibold">Others</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((item, index) => (
                  <tr key={index} className="last:border-none">
                    <td className="p-1 md:p-4 text-center border-b border-[#101010] text-[#1a1a1a] text-left font-medium text-sm md:text-base">{item.feature}</td>
                    <td className="p-1 md:p-4 text-center border-b border-[#101010] bg-[#ff0] rounded-lg">{item.isGoBike ? <TickMark /> : <CrossMark />}</td>
                    <td className="p-1 md:p-4 text-center border-b border-[#101010]">{item.isOthers ? <TickMark /> : <CrossMark />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

// ====================================================================
// CommunitySection Component
// ====================================================================
const CommunitySection = () => {
  return (
    <section className="py-12 px-2.5 font-sans bg-[#f8f9fa]">
      <div className="max-w-[1450px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-20 items-center p-2.5">
          <div className="w-full">
            <Image loading="lazy" src="https://gobikes.au/wp-content/uploads/2025/08/electric-bike-ebike-for-kids-1.webp" alt="GoBike community" width={2199} height={2560} sizes="(max-width: 768px) 100vw, 50vw" className="w-full h-auto block rounded-2xl" />
          </div>
          <div className="text-center">
            <h2 className="text-[32px] font-extrabold text-black mb-5 tracking-tight leading-[1.2]">More Than a Bike - It is The GoBike Family</h2>
            <p className="text-[17px] text-[#333] leading-[1.8] mb-6 max-w-[700px] mx-auto text-left">At GoBike, our passion is creating unforgettable riding experiences. We did not just set out to sell another kids ebike, we aimed to design the <strong>best electric bike for kids</strong> in Australia, ensuring a fun-filled adventure for them and a stress-free experience for parents.</p>
            <p className="text-[17px] text-[#333] leading-[1.8] mb-6 max-w-[700px] mx-auto text-left">Every <strong>electric balance bike</strong> we create is a blend of fun, reliability, and safety. By choosing GoBike, youâ€™re not just getting a top-quality <strong>kids electric motorbike</strong>; youâ€™re joining a community that values adventure and family bonding.</p>
            <p className="text-[18px] text-black font-semibold mb-8">Create lasting memories and join the adventure today!</p>
            <Link href="/bikes" className="inline-block bg-black text-white py-3.5 px-9 rounded-full font-bold text-base border-2 border-transparent transition-all duration-300 hover:bg-white hover:text-black hover:border-black">Join The Community</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ====================================================================
// VideoReviews Component
// ====================================================================
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
        if (currentRef) observer.observe(currentRef);

        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, []);

    if (showVideo) {
        return (
            <div className="relative block bg-cover bg-center rounded-2xl overflow-hidden cursor-pointer shadow-xl aspect-video">
                <iframe className="absolute top-0 left-0 w-full h-full border-0" src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`} title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>
        );
    }

    return (
        <div 
            ref={ref} 
            className="relative block bg-cover bg-center rounded-2xl overflow-hidden cursor-pointer shadow-xl aspect-video group" 
            onClick={() => setShowVideo(true)} 
            style={{ 
                backgroundImage: isIntersecting ? `url('${thumbnailUrl}')` : 'none',
                backgroundColor: isIntersecting ? 'transparent' : '#e0e0e0' 
            }}
        >
            <div className="absolute inset-0 bg-black/20"></div>
            {isIntersecting && (
                <div className="w-20 h-14 bg-black/70 rounded-xl absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-200 flex items-center justify-center group-hover:scale-110 group-hover:bg-red-600/80">
                    <div className="w-0 h-0 border-y-[12px] border-y-transparent border-l-[20px] border-l-white ml-1"></div>
                </div>
            )}
        </div>
    );
}

const VideoReviews = () => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const videoData = [
        { youtubeId: "Fl8jEUxS_LU", thumbnailUrl: "https://i.ytimg.com/vi/Fl8jEUxS_LU/maxresdefault.jpg", title: "Unboxing & First Ride: The GoBike 12 Experience", description: "From first rides to pro-level tricks, our video reviews showcase the real-world performance and unbeatable fun." },
        { youtubeId: "BARebHNa3lY", thumbnailUrl: "https://i.ytimg.com/vi/BARebHNa3lY/maxresdefault.jpg", title: "GoBike 16: From Parks to Trails", description: "A deep-dive review showing the GoBike 16 versatility and power on different terrains." },
        { youtubeId: "CIevuTbyTlY", thumbnailUrl: "https://i.ytimg.com/vi/CIevuTbyTlY/maxresdefault.jpg", title: "Parents Guide: Choosing The Right GoBike", description: "Confused between models? This helpful guide breaks down the features of each GoBike." },
    ];

    const scroll = (direction: 'left' | 'right') => {
        if (sliderRef.current) {
            const { current } = sliderRef;
            const slideWidth = current.children[0].clientWidth + 30; 
            const scrollAmount = direction === 'left' ? -slideWidth : slideWidth;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section className="py-12 px-2.5 font-sans bg-[#f8f9fa]">
            <div className="text-center mb-8">
                <h2 className="text-[32px] font-bold text-[#1a1a1a] mb-3 tracking-tight">See Why Parents & Kids Love The GoBike</h2>
                <p className="text-lg text-[#1a1a1a] max-w-[800px] mx-auto leading-[1.5]">From first rides to pro-level tricks, our video reviews showcase the real-world performance and unbeatable fun of our kids electric bikes. See them in action!</p>
            </div>
            <div className="max-w-[1500px] mx-auto px-0.5 relative">
                <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-[30px]" ref={sliderRef}>
                    {videoData.map((video, index) => (
                        <div className="flex-none w-[95%] md:w-[48%] snap-start box-border" key={index}>
                            <YouTubePlayer youtubeId={video.youtubeId} thumbnailUrl={video.thumbnailUrl} />
                            <div className="mt-6 text-center">
                                <h3 className="text-[22px] font-bold text-[#1a1a1a] mb-1.5">{video.title}</h3>
                                <p className="text-base text-black m-0 leading-[1.6] max-w-[600px] mx-auto">{video.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={() => scroll('left')} className="absolute top-[40%] -translate-y-1/2 -left-[5px] bg-black/60 text-white border-none rounded-full w-[45px] h-[45px] text-xl cursor-pointer z-10 transition-colors hover:bg-black/90 flex items-center justify-center">&#10094;</button>
                <button onClick={() => scroll('right')} className="absolute top-[40%] -translate-y-1/2 -right-[5px] bg-black/60 text-white border-none rounded-full w-[45px] h-[45px] text-xl cursor-pointer z-10 transition-colors hover:bg-black/90 flex items-center justify-center">&#10095;</button>
            </div>
        </section>
    );
}
      
// ====================================================================
// FaqSection Component
// ====================================================================
const faqs = [
    { question: "Are electric bikes safe for young children?", answer: "Absolutely! Our entire range of <strong>electric bikes for kids</strong> is designed with safety as the number one priority. They feature parental speed controls, sturdy yet lightweight frames, and reliable braking systems, making them the <strong>Perfect bike for toddlers</strong> and young kids to build confidence and master their balance safely." },
    { question: "How do I choose the best kids electric bike?", answer: "Finding the <strong>best kids electric bike</strong> comes down to your child's age, size, and confidence level. Key things to look for are the correct size (e.g., 12\" or 16\" wheels), adjustable speed settings, and great battery life. Our collection ticks all these boxes, making the choice simple for Aussie parents." },
    { question: "What's the difference between a kids e-bike and a kids motorbike?", answer: "While both offer powered fun, a <strong>kids ebike</strong> is essentially an electric-powered balance bike designed for learning. It's light and easy to handle. A traditional petrol <strong>Kids Motorbike</strong> is often heavier and more complex. Our e-bikes deliver the \"motorbike\" thrill with the safety and simplicity young riders need." },
    { question: "What age are these childrens electric bikes for?", answer: "Our <strong>childrens electric bikes</strong> cater for a wide age range, typically from toddlers as young as 2 up to 16 years old. The adjustable speed settings make this possible. It's the kind of versatile <strong>electric bike</strong> that truly grows with your child." },
    { question: "What's the speed and battery life like on an ebike for kids?", answer: "An <strong>ebike for kids</strong> is designed for safe fun, not racing. Most models feature two speed modes: a slow learning mode (around 8-10 km/h) and a faster mode (up to 18 km/h). The high-quality battery is built to last for hours of riding on a single charge." }
];

const FaqSection = () => {
  return (
    <section className="py-12 px-2.5 font-sans">
      <div className="max-w-[1500px] mx-auto px-2.5">
        <h2 className="text-center mb-9 text-[#1a202c] font-sans text-[32px] font-semibold">Got Questions About Kids e-Bikes? We Have the Answers.</h2>
        <p className="font-sans text-center text-[17px] text-[#4a5568] max-w-[650px] mx-auto -mt-4 mb-10 leading-[1.6]">Got questions about the <strong>best kids electric bike</strong>? We have answered the most common ones below to help you choose the perfect GoBike for your child in Australia.</p>
        
        {faqs.map((faq, index) => (
          <details className="group bg-white mb-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#e2e8f0] transition-shadow duration-300 hover:shadow-[0_6px_25px_rgba(0,0,0,0.08)]" key={index}>
            <summary className="w-full p-6 bg-transparent border-none text-left font-sans text-[18px] font-medium text-[#2d3748] cursor-pointer flex justify-between items-center group-open:text-[#0056b3]">
              <span>{faq.question}</span>
              <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
            </summary>
            <div className="px-6 pb-6 overflow-hidden transition-all duration-400 ease-in-out text-[#4a5568] text-base leading-[1.7]">
              <p dangerouslySetInnerHTML={{ __html: faq.answer }}></p>
            </div>
          </details>
        ))}
        
        <div className="text-center mt-10">
          <Link href="/faq" className="inline-block py-3.5 px-8 bg-black text-white font-sans text-base font-medium no-underline rounded-full transition-all duration-300 hover:text-white hover:-translate-y-1">View All FAQs</Link>
        </div>
      </div>
    </section>
  );
}

// ====================================================================
// Main Page Component
// ====================================================================
export default function HomePageClient() {
  return (
    <>
      <HeroSlider />
      <TrustBadges />
      <LazyLoadSection>
        <div className="max-w-[1500px] mx-auto px-4"><hr className="border-t border-[#e0e0e0] my-4" /></div>
        <ProductCollection />
      </LazyLoadSection>
      
      <LazyLoadSection>
        <div className="max-w-[1500px] mx-auto px-4"><hr className="border-t border-[#e0e0e0] my-4" /></div>
        <OurStory />
      </LazyLoadSection>
      
      <LazyLoadSection>
        <div className="max-w-[1500px] mx-auto px-4"><hr className="border-t border-[#e0e0e0] my-4" /></div>
        <SmarterChoice />
      </LazyLoadSection>
      
      <LazyLoadSection>
        <div className="max-w-[1500px] mx-auto px-4"><hr className="border-t border-[#e0e0e0] my-4" /></div>
        <FeaturedBikes />
      </LazyLoadSection>
      
      <LazyLoadSection>
        <div className="max-w-[1500px] mx-auto px-4"><hr className="border-t border-[#e0e0e0] my-4" /></div>
        <DifferenceSection />
      </LazyLoadSection>

      <LazyLoadSection>
        <CommunitySection />
      </LazyLoadSection>
      
      <LazyLoadSection>
        <div className="max-w-[1500px] mx-auto px-4"><hr className="border-t border-[#e0e0e0] my-4" /></div>
        <HomePageReviews />
      </LazyLoadSection>

      <LazyLoadSection>
        <div className="max-w-[1500px] mx-auto px-4"><hr className="border-t border-[#e0e0e0] my-4" /></div>
        <VideoReviews />
      </LazyLoadSection>

      <LazyLoadSection>
        <div className="max-w-[1500px] mx-auto px-4"><hr className="border-t border-[#e0e0e0] my-4" /></div>
        <FaqSection />
      </LazyLoadSection>
      
      <div className="max-w-[1500px] mx-auto px-4"><hr className="border-t border-[#e0e0e0] my-4" /></div>
    </>
  );
}