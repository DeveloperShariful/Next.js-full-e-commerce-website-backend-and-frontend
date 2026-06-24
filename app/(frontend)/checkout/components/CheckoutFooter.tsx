import Link from 'next/link';
import Image from 'next/image';

const trustBadges = [
  {
    icon: (
      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: '100% Secure Checkout',
    sub: 'SSL encrypted payment',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Easy 30-Day Returns',
    sub: 'Hassle-free return policy',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Same-Day Dispatch',
    sub: 'Fast Australia-wide shipping',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: 'Expert Aussie Support',
    sub: 'Here to help anytime',
  },
];

const paymentIcons = [
  {
    src: 'https://rgy4iw8lybyokbyt.public.blob.vercel-storage.com/Apple_Pay-Logo.wine-WwzHKTdKTtEYxYzkt32CDcB4DRS93R.svg',
    alt: 'Apple Pay',
    width: 160, height: 44,
    box: 'h-10 px-1 py-1 sm:h-12 sm:min-w-[80px] sm:px-2',
    img: 'h-8 max-w-full sm:h-10 sm:max-w-[120px]',
  },
  {
    src: 'https://rgy4iw8lybyokbyt.public.blob.vercel-storage.com/svgviewer-output-YUYAUZ7am3poOTgMoWNwremAzaQbsF.jpg',
    alt: 'Google Pay',
    width: 220, height: 56,
    box: 'h-10 px-1 py-1 sm:h-14 sm:min-w-[90px] sm:px-2',
    img: 'h-8 max-w-full sm:h-12 sm:max-w-[140px]',
  },
  {
    src: 'https://rgy4iw8lybyokbyt.public.blob.vercel-storage.com/Link_idHNoUBT0y_0-zvoRkBAOydrJpRwDdptkNjn8MlwmQM.png',
    alt: 'Link Pay',
    width: 120, height: 32,
    box: 'h-10 px-1 py-1.5 sm:h-11 sm:min-w-[64px] sm:px-3 sm:py-2',
    img: 'h-6 max-w-full sm:h-7 sm:max-w-[90px]',
  },
  {
    src: 'https://gobikes.au/wp-content/uploads/2026/05/Credit-Card-Icons.webp',
    alt: 'Visa / Mastercard / Amex',
    width: 120, height: 32,
    box: 'h-10 px-1 py-1.5 sm:h-11 sm:min-w-[64px] sm:px-3 sm:py-2',
    img: 'h-6 max-w-full sm:h-7 sm:max-w-[90px]',
  },
  {
    src: 'https://rgy4iw8lybyokbyt.public.blob.vercel-storage.com/WooCommerce-PayPal-Pay-Later%20%281%29-wYfLILZCgu0rFsFTytK7WT6BFlmTTW.png',
    alt: 'Pay Later',
    width: 100, height: 56,
    box: 'h-10 px-1 py-1 sm:h-12 sm:min-w-[90px]',
    img: 'h-8 max-w-full sm:h-12 sm:max-w-[140px]',
  },
  {
    src: 'https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png',
    alt: 'PayPal',
    width: 80, height: 32,
    box: 'h-10 px-1 py-1.5 sm:h-11 sm:min-w-[64px] sm:px-3 sm:py-2',
    img: 'h-6 max-w-full sm:h-7 sm:max-w-[90px]',
  },
  {
    src: 'https://static.afterpay.com/integration/logo-afterpay-colour.svg',
    alt: 'Afterpay',
    width: 90, height: 32,
    box: 'h-10 px-1 py-1.5 sm:h-11 sm:min-w-[64px] sm:px-3 sm:py-2',
    img: 'h-6 max-w-full sm:h-7 sm:max-w-[90px]',
  },
  {
    src: 'https://gobikes.au/wp-content/uploads/2026/05/Zip-Pay-Logo.webp',
    alt: 'Zip Pay',
    width: 60, height: 32,
    box: 'h-10 px-1 py-1.5 sm:h-11 sm:min-w-[64px] sm:px-3 sm:py-2',
    img: 'h-6 max-w-full sm:h-7 sm:max-w-[90px]',
  },
  {
    src: 'https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg',
    alt: 'Klarna',
    width: 60, height: 32,
    box: 'h-10 px-1 py-1.5 sm:h-11 sm:min-w-[64px] sm:px-3 sm:py-2',
    img: 'h-6 max-w-full sm:h-7 sm:max-w-[90px]',
  },
];

export default function CheckoutFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[#e5e7eb] bg-white mt-8">

      {/* Trust badges */}
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {trustBadges.map((badge, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">{badge.icon}</div>
              <div>
                <p className="text-[13px] font-semibold text-gray-800 leading-tight">{badge.title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{badge.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#f0f0f0]" />

      {/* Payment icons */}
      <div className="max-w-[1400px] mx-auto px-4 py-4 flex flex-col items-center gap-3">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">
          We accept
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {paymentIcons.map((icon) => (
            <div
              key={icon.alt}
              className={`bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm ${icon.box}`}
              title={icon.alt}
            >
              <Image
                src={icon.src}
                alt={icon.alt}
                width={icon.width}
                height={icon.height}
                className={`w-auto object-contain ${icon.img}`}
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#f0f0f0]" />

      {/* Bottom bar */}
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[11px] text-gray-400">
          © {year} GoBikes. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          {[
            { label: 'Privacy Policy', href: '/privacy-policy' },
            { label: 'Terms & Conditions', href: '/terms-condition' },
            { label: 'Contact Us', href: '/contact' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

    </footer>
  );
}
