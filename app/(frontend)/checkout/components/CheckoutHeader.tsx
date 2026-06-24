import Link from 'next/link';
import Image from 'next/image';

export default function CheckoutHeader() {
  return (
    <header className="w-full bg-white border-b border-[#e5e7eb] sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-center">
        <Link href="/" aria-label="Back to GoBike home">
          <Image
            src="https://gobikes.au/wp-content/uploads/2025/06/GOBIKE-Electric-Bike-for-kids-1.webp"
            alt="GoBike Australia"
            width={200}
            height={46}
            className="h-10 w-auto"
            priority
          />
        </Link>
      </div>
    </header>
  );
}
