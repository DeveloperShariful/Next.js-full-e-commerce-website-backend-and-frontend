// app/faq/page.tsx

import Breadcrumbs from '@/components/Breadcrumbs';
import Image from 'next/image';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) | GoBike Australia',
  description: 'Find answers to common questions about our kids electric bikes, shipping, warranty, safety, and more. Get all the information you need before you buy.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'Frequently Asked Questions (FAQ) | GoBike Australia',
    description: 'Find answers to common questions about our kids electric bikes, shipping, warranty, safety, and more.',
    url: 'https://gobike.au/faq',
    siteName: 'GoBike Australia',
    images: [
      {
        url: 'https://gobikes.au/wp-content/uploads/2025/10/gobike-au-1-year-warranty-kids-ebikes.webp',
        width: 1200,
        height: 857,
        alt: 'A smiling Australian child with a helmet enjoying a GoBike electric bike',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
};

// SEO এর জন্য সম্পূর্ণ JSON-LD ডেটা
const jsonLdData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question","name": "Why choose an electric balance bike over a pedal bike?","acceptedAnswer": {"@type": "Answer","text": "An electric balance bike teaches the most crucial skill—balance—but adds a low-speed throttle to build confidence and make riding incredibly fun, helping kids learn faster."}},
    {"@type": "Question","name": "How do I choose the right size bike for my child?","acceptedAnswer": {"@type": "Answer","text": "The best measure is inseam. Your child should be able to sit on the seat with their feet flat on the ground. Check our product pages for detailed size guides."}},
    {"@type": "Question","name": "What is the weight limit for GoBikes?","acceptedAnswer": {"@type": "Answer","text": "Our bikes are built tough! Please refer to the specific product page for the exact weight limit of each model."}},
    {"@type": "Question","name": "Do you assemble the bikes?","acceptedAnswer": {"@type": "Answer","text": "GoBikes are delivered 80% pre-assembled. Attaching the handlebar and front wheel takes about 15 minutes. A basic toolkit is provided."}},
    {"@type": "Question","name": "How long will my GoBike battery last?","acceptedAnswer": {"@type": "Answer","text": "The GoBike battery provides up to 75 minutes of riding time on a single full charge."}},
    {"@type": "Question","name": "How long does it take to charge?","acceptedAnswer": {"@type": "Answer","text": "A full charge takes approximately 60 minutes."}},
    {"@type": "Question","name": "Can I use a power tool battery with my GoBike?","acceptedAnswer": {"@type": "Answer","text": "No. For safety and warranty, you must only use the genuine GoBike battery. Using unauthorised batteries is done at your own risk."}},
    {"@type": "Question","name": "Does the bike come with a charger?","acceptedAnswer": {"@type": "Answer","text": "Yes, every GoBike comes with its own specific, high-quality battery charger included in the box."}},
    {"@type": "Question","name": "How can I ensure my kids are riding safely?","acceptedAnswer": {"@type": "Answer","text": "We recommend ALWAYS using a helmet and closed-toe shoes. It is crucial to supervise young riders and check local helmet safety laws."}},
    {"@type": "Question","name": "Can the bike be ridden in wet conditions?","acceptedAnswer": {"@type": "Answer","text": "GoBikes are not 100% waterproof. Occasional puddles are fine if the bike is thoroughly cleaned and dried afterwards."}},
    {"@type": "Question","name": "Can I attach training wheels?","acceptedAnswer": {"@type": "Answer","text": "GoBikes are designed as balance bikes, so training wheels are not needed or recommended."}},
    {"@type": "Question","name": "Are electric bikes legal for kids in Australia?","acceptedAnswer": {"@type": "Answer","text": "Yes. Our bikes are classed as power-assisted pedal cycles with low power, making them legal for kids on private property."}},
    {"@type": "Question","name": "Can my kids race on GoBikes?","acceptedAnswer": {"@type": "Answer","text": "Absolutely! GoBikes are perfect for fun local club races and events."}},
    {"@type": "Question","name": "Why would I need suspension forks?","acceptedAnswer": {"@type": "Answer","text": "Suspension forks are a popular upgrade for kids on rougher terrain. They absorb bumps, providing better comfort and control."}},
    {"@type": "Question","name": "Where can I get spare parts?","acceptedAnswer": {"@type": "Answer","text": "We use standard parts for items like brakes and tyres, available at your local bike shop. For specific GoBike parts, contact us directly."}},
    {"@type": "Question","name": "How should I clean the bike?","acceptedAnswer": {"@type": "Answer","text": "Do not use a pressure washer. Remove the battery, then clean with a gentle hose and bucket."}},
    {"@type": "Question","name": "How do I make a warranty claim?","acceptedAnswer": {"@type": "Answer","text": "Our products adhere to the Australian Consumer Law. For claims, contact your original place of purchase with proof of purchase."}},
    {"@type": "Question","name": "Do you ship Australia-wide?","acceptedAnswer": {"@type": "Answer","text": "Yes! We offer fast shipping for our electric bikes all across Australia."}},
    {"@type": "Question","name": "Can I pick up my order locally?","acceptedAnswer": {"@type": "Answer","text": "Yes, local pickup is available in Camden, NSW."}},
    {"@type": "Question","name": "What is your return policy?","acceptedAnswer": {"@type": "Answer","text": "We offer a return policy on unused bikes in their original packaging. For full details, please visit our official Return Policy page."}}
  ]
};

export default function FaqPage() {
  return (
    <div>
      <Breadcrumbs />
      <>
        {/* .faqPageContainer replaced */}
        <div className="max-w-[1400px] mx-auto p-[5px] font-sans text-gray-600">
          
          {/* .faqPageHeader replaced */}
          <header className="text-center mb-[5px]">
              {/* .faqPageMainTitle replaced */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-[1.2] mb-[15px]">
                GoBike FAQ | Australia&apos;s Top Questions Answered
              </h1>
              {/* .faqPageIntro replaced */}
              <p className="text-lg leading-[1.7] max-w-[750px] mx-auto text-gray-600">
                Welcome to the GoBike Help Centre! Here you&apos;ll find clear answers to all your questions about our <strong>kids electric bikes</strong>—from safety and sizing to battery life and delivery across Australia.
              </p>
          </header>
          
          {/* .ourPromiseSection replaced */}
          <section className="flex flex-col md:flex-row items-center gap-[50px] mb-[60px] bg-white p-[25px] md:p-[50px] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.07)]">
              {/* .promiseImageWrapper replaced */}
              <div className="w-full md:w-2/5 shrink-0">
                 <Image 
                    src="https://gobikes.au/wp-content/uploads/2025/08/Gobike-kids-electric-bike-ebike-for-kids-4-scaled.webp" 
                    alt="A smiling Australian child with a helmet enjoying a GoBike electric bike in a park"
                    className="w-full h-auto rounded-2xl"
                    width={2049} height={2560} sizes="(max-width: 768px) 100vw, 50vw"
                 />
              </div>
              {/* .promiseContentWrapper replaced */}
              <div className="w-full md:w-3/5">
                  <h2 className="text-[26px] font-semibold text-gray-800 mt-0 mb-5">The GoBike Promise</h2>
                  {/* .promiseList replaced */}
                  <ul className="list-none p-0 m-0">
                      <li className="flex items-start mb-[15px] text-base">
                        <span className="text-[#007bff] mr-[15px] text-[22px] leading-[1.5]">✔</span>
                        <span><strong>Safety First:</strong> Engineered with parental controls and durable materials for your peace of mind.</span>
                      </li>
                      <li className="flex items-start mb-[15px] text-base">
                        <span className="text-[#007bff] mr-[15px] text-[22px] leading-[1.5]">✔</span>
                        <span><strong>Built for Fun:</strong> Lightweight, easy to handle, and designed to make learning to ride an exciting adventure.</span>
                      </li>
                      <li className="flex items-start mb-[15px] text-base">
                        <span className="text-[#007bff] mr-[15px] text-[22px] leading-[1.5]">✔</span>
                        <span><strong>Quality That Lasts:</strong> We use high-quality components to ensure your GoBike can handle years of fun.</span>
                      </li>
                  </ul>
              </div>
          </section>

          {/* ===== Category 1: About The Bikes & Sizing ===== */}
          {/* .faqCategoryTitle replaced */}
          <h2 className="mt-[50px] mb-5 pb-2.5 border-b-2 border-gray-200 text-gray-800 text-2xl font-semibold text-center md:text-left">
            About The Bikes & Sizing
          </h2>

          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>Why choose an electric balance bike over a pedal bike?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>An <strong>electric balance bike</strong> is the best of both worlds. It teaches the most crucial skill—balance—but adds a low-speed throttle to build confidence and make riding incredibly fun, helping kids learn faster.</p>
              </div>
          </details>
          
          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>How do I choose the right size bike for my child?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>The best measure is inseam. Your child should be able to sit on the seat with their feet flat on the ground. Check our product pages or our dedicated <a href="https://www.evanscycles.com/help/bike-sizing-kids" target="_blank" rel="noopener noreferrer" className="text-[#007bff] no-underline font-medium hover:underline">Sizing Guide</a> for detailed charts.</p>
              </div>
          </details>

          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>What is the weight limit for GoBikes?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>Our bikes are built tough! Please refer to the specific product page for the exact <strong>weight limit</strong> of each model, as it varies slightly between the GOBIKE 12 and GOBIKE 16.</p>
              </div>
          </details>
          
          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>Do you assemble the bikes?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>GoBikes are delivered <strong>80% pre-assembled</strong>. Attaching the handlebar and front wheel takes about <strong>15 minutes</strong>. A <strong>basic toolkit is provided</strong> in the package to make it simple.</p>
              </div>
          </details>

          {/* ===== Category 2: Battery & Charging ===== */}
          <h2 className="mt-[50px] mb-5 pb-2.5 border-b-2 border-gray-200 text-gray-800 text-2xl font-semibold text-center md:text-left">
            Battery & Charging
          </h2>

          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>How long will my GoBike battery last?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>The <strong>GoBike battery</strong> provides <strong>up to 75 minutes of riding time</strong> on a full charge. For expert tips on battery health, we recommend this official <a href="https://www.bosch-ebike.com/fileadmin/EBC/Service/Downloads/Akku_Guide/Akku_Guide/Bosch-eBike-Akkuguide-EN-GB.pdf" target="_blank" rel="noopener noreferrer" className="text-[#007bff] no-underline font-medium hover:underline">e-bike Battery Guide</a>.</p>
              </div>
          </details>

          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>How long does it take to charge?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>A full <strong>charge takes approximately 60 minutes</strong>.</p>
              </div>
          </details>
          
          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>Can I use a power tool battery with my GoBike?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>No. For safety and warranty, you must <strong>only use the genuine GoBike battery</strong>. Using unauthorised batteries is done entirely <strong>at your own risk</strong>.</p>
              </div>
          </details>

          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>Does the bike come with a charger?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>Yes, every GoBike comes with its own specific, high-quality battery charger included in the box.</p>
              </div>
          </details>

          {/* ===== Category 3: Riding & Safety ===== */}
          <h2 className="mt-[50px] mb-5 pb-2.5 border-b-2 border-gray-200 text-gray-800 text-2xl font-semibold text-center md:text-left">
            Riding & Safety
          </h2>
          
          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>How can I ensure my kids are riding safely?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>We recommend <strong>ALWAYS using a helmet</strong> and closed-toe shoes. For detailed state-specific rules, check the official <a href="https://www.transport.nsw.gov.au/roadsafety/bicycle-riders/ebikes" target="_blank" rel="noopener noreferrer" className="text-[#007bff] no-underline font-medium hover:underline">helmet safety laws</a>. Always supervise young riders.</p>
              </div>
          </details>
              
          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>Can the bike be ridden in wet conditions?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>GoBikes are not 100% waterproof. Occasional puddles are fine if the bike is <strong>thoroughly cleaned and dried afterwards</strong>.</p>
              </div>
          </details>

          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>Can I attach training wheels?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>GoBikes are designed as balance bikes, so <strong>training wheels are not needed or recommended</strong>. They learn to balance much faster without them.</p>
              </div>
          </details>

          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>Are electric bikes legal for kids in Australia?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>Yes. Our bikes are classed as power-assisted pedal cycles with low power, making them legal for kids on private property. Public road laws vary by state.</p>
              </div>
          </details>

          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>Can my kids race on GoBikes?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>Absolutely! GoBikes are perfect for fun local club races and events.</p>
              </div>
          </details>

          {/* ===== Category 4: Maintenance, Parts & Warranty ===== */}
          <h2 className="mt-[50px] mb-5 pb-2.5 border-b-2 border-gray-200 text-gray-800 text-2xl font-semibold text-center md:text-left">
            Maintenance, Parts & Warranty
          </h2>
          
          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>Why would I need suspension forks?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p><strong>Suspension forks</strong> are a popular upgrade for kids on rougher terrain. They absorb bumps, providing better comfort and control.</p>
              </div>
          </details>

          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>Where can I get spare parts?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>We use standard parts for items like brakes, grips, and tyres, which are available at your <strong>local bike shop</strong>. For specific GoBike parts, <Link href="/contact" className="text-[#007bff] no-underline font-medium hover:underline"> Contect us </Link> directly.</p>
              </div>
          </details>
          
          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>How should I clean the bike?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>Please <strong>do not use a pressure washer</strong>. Remove the battery, then clean with a gentle hose and bucket.</p>
              </div>
          </details>

          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>How do I make a warranty claim?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>Our products adhere to the <strong>Australian Consumer Law</strong>. For claims, contact your original place of purchase with proof of purchase. Read more on the official <a href="https://www.accc.gov.au/consumers/buying-products-and-services/consumer-rights-and-guarantees" target="_blank" rel="noopener noreferrer" className="text-[#007bff] no-underline font-medium hover:underline">ACCC website</a>.</p>
              </div>
          </details>

          {/* ===== Category 5: Purchase & Shipping ===== */}
          <h2 className="mt-[50px] mb-5 pb-2.5 border-b-2 border-gray-200 text-gray-800 text-2xl font-semibold text-center md:text-left">
            Purchase & Shipping
          </h2>

          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>Do you ship Australia-wide?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>Yes! We offer <strong>fast shipping for our electric bikes all across Australia</strong>.</p>
              </div>
          </details>
          
          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>Can I pick up my order locally?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>Yes, <strong>local pickup is available in Camden, NSW</strong>. We plan to open more locations soon!</p>
              </div>
          </details>

          <details className="group bg-white mb-[15px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 open:border-blue-200">
              <summary className="w-full p-6 bg-none border-none text-left text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>What is your return policy?</span>
                <span className="text-xl font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90">&gt;</span>
              </summary>
              <div className="px-6 pb-6 text-base leading-[1.7]">
                <p>We offer a return policy on unused bikes in their original packaging. For full details, please visit our official <Link href="/privacy-policy" className="text-[#007bff] no-underline font-medium hover:underline"> Return Policy page </Link>.</p>
              </div>
          </details>

          {/* Final Call to Action */}
          <div className="text-center mt-[50px] p-[30px] bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
              <h3 className="text-[22px] font-semibold text-black mb-[15px]">Still Have Questions?</h3>
              <Link 
                href="/contact" 
                className="inline-block px-7 py-3 bg-black text-white text-center font-semibold rounded-lg border border-transparent cursor-pointer transition-all duration-300 ease-out hover:bg-[#333] hover:-translate-y-0.5"
              >
                 Contect Us 
              </Link>
          </div>

        </div>

        {/* SEO এর জন্য JSON-LD স্ক্রিপ্ট */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </>
    </div>
  );
}