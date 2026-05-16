// app/privacy-policy/page.tsx

import Breadcrumbs from '@/components/Breadcrumbs';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | GoBike Australia',
  description: 'Read how GoBike Australia collects, uses, and protects your personal data. Your privacy is important to us. Learn more about our commitment to data security.',
  alternates: {
    canonical: '/privacy-policy',
  },
  openGraph: {
    title: 'Privacy Policy | GoBike Australia',
    description: 'Read how GoBike Australia collects, uses, and protects your personal data. Your privacy is important to us.',
    url: 'https://gobike.au/privacy-policy',
    siteName: 'GoBike Australia',
    images: [
      {
        url: 'https://gobikes.au/wp-content/uploads/2025/11/gobike-au-1-year-warranty-kids-ebikes.jpg', 
        width: 1200,
        height: 857,
        alt: 'GoBike Australia Privacy Policy',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div>
      <Breadcrumbs />
      {/* .privacyPolicyContent replaced */}
      <div className="font-sans text-[#333] leading-[1.8] text-[17px] max-w-[1000px] mx-auto px-4 mb-20">
        
        {/* h1 replaced */}
        <h1 className="text-[35px] font-extrabold text-[#1a1a1a] mb-5 text-center">
            Privacy Policy for GoBike.au
        </h1>
        {/* .lastUpdated replaced */}
        <p className="text-center text-[#888] text-[15px] mb-[3em]">
            Last Updated: 12 August 2025
        </p>
        
        <p className="mb-4">
            At <strong><Link href="/" className="text-[#007bff] font-semibold no-underline hover:underline"> Gobike </Link></strong>, your privacy is our priority. This Privacy Policy outlines how we collect, use, and protect your personal information when you browse or shop for your next <strong>Kids Ebike</strong> on our website. We are fully compliant with the Australian Privacy Principles (APPs) as set out in the <em><a href="https://www.oaic.gov.au/privacy/privacy-legislation/the-privacy-act" className="text-[#007bff] font-semibold no-underline hover:underline">Privacy Act 1988 (Cth)</a></em>.
        </p>

        {/* h2 replaced */}
        <h2 className="text-[24px] font-bold text-[#1a1a1a] mt-[2.5em] mb-[1em] border-b-2 border-[#f0f0f0] pb-[10px]">
            1. What Information We Collect
        </h2>
        <p className="mb-4">When you interact with GoBike.au, we may collect the following information to provide you with the best service:</p>
        {/* ul and li replaced with custom bullet styling */}
        <ul className="list-none pl-0">
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            <strong className="text-[#1a1a1a]">Personal Details:</strong> Full name, contact number, and email address.
          </li>
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            <strong className="text-[#1a1a1a]">Order Information:</strong> Shipping and billing addresses for your <strong>Ebike for kids</strong> purchase.
          </li>
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            <strong className="text-[#1a1a1a]">Payment Details:</strong> Your payment information is not stored by us. It is processed securely through trusted and PCI-DSS compliant gateways like Stripe and PayPal.
          </li>
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            <strong className="text-[#1a1a1a]">Browsing Data:</strong> We use cookies and analytics tools like Google Analytics to understand browsing behaviour, which helps us improve our website and product listings.
          </li>
        </ul>

        <h2 className="text-[24px] font-bold text-[#1a1a1a] mt-[2.5em] mb-[1em] border-b-2 border-[#f0f0f0] pb-[10px]">
            2. How We Use Your Data
        </h2>
        <p className="mb-4">Your data is used exclusively to enhance your experience with GoBike.au. This includes:</p>
        <ul className="list-none pl-0">
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            Fulfilling and processing your orders for any <strong>Kids Ebike</strong> or accessory.
          </li>
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            Providing timely customer support and responding to your enquiries.
          </li>
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            Sending you marketing communications, such as promotions and newsletters, but only if you have explicitly opted in.
          </li>
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            Improving our website, products, and services based on customer feedback and browsing patterns.
          </li>
        </ul>
        
        <h2 className="text-[24px] font-bold text-[#1a1a1a] mt-[2.5em] mb-[1em] border-b-2 border-[#f0f0f0] pb-[10px]">
            3. Data Security: Our Commitment to You
        </h2>
        <p className="mb-4">We take the security of your personal data very seriously. Our website is protected with multiple layers of security to ensure your information is safe:</p>
        <ul className="list-none pl-0">
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            <strong className="text-[#1a1a1a]">SSL Encryption:</strong> Our entire website uses SSL (Secure Socket Layer) encryption to protect data transmitted between your browser and our server.
          </li>
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            <strong className="text-[#1a1a1a]">Secure Payment Gateways:</strong> We never store your full credit card details. All transactions are handled by industry-leading, secure payment processors.
          </li>
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            <strong className="text-[#1a1a1a]">Regular Audits:</strong> Our infrastructure is regularly audited to protect against vulnerabilities and ensure the highest level of security.
          </li>
        </ul>

        <h2 className="text-[24px] font-bold text-[#1a1a1a] mt-[2.5em] mb-[1em] border-b-2 border-[#f0f0f0] pb-[10px]">
            4. Your Rights and Choices
        </h2>
        <p className="mb-4">In accordance with Australian Privacy Law, you have full control over your personal information. You have the right to:</p>
        <ul className="list-none pl-0 mb-4">
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            Access the personal information we hold about you.
          </li>
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            Request a correction to any information that is inaccurate or out of date.
          </li>
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            Request the deletion of your personal data from our systems.
          </li>
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            Opt-out of marketing communications at any time.
          </li>
        </ul>
        <p className="mb-4">
            To exercise these rights, please contact us using the details below. For more information on your privacy rights, you may visit the official website of the <a href="https://www.oaic.gov.au/" target="_blank" rel="noopener noreferrer" className="text-[#007bff] font-semibold no-underline hover:underline">Office of the Australian Information Commissioner (OAIC)</a>.
        </p>

        <h2 className="text-[24px] font-bold text-[#1a1a1a] mt-[2.5em] mb-[1em] border-b-2 border-[#f0f0f0] pb-[10px]">
            5. Contact Us
        </h2>
        <p className="mb-4">If you have any questions about this Privacy Policy or how we handle your data, please do not hesitate to reach out. Our friendly Aussie team is always here to help.</p>
        <ul className="list-none pl-0">
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            <strong className="text-[#1a1a1a]">Business Name:</strong> GoBike.au
          </li>
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            <strong className="text-[#1a1a1a]">Email:</strong> <a href="mailto:gobike@gobike.au" className="text-[#007bff] font-semibold no-underline hover:underline">gobike@gobike.au</a>
          </li>
          <li className="relative pl-[25px] mb-[10px] before:content-['•'] before:absolute before:left-0 before:text-[#007bff] before:font-bold">
            <strong className="text-[#1a1a1a]">Phone:</strong> <a href="tel:+61426067277" className="text-[#007bff] font-semibold no-underline hover:underline">+61 426067277</a>
          </li>
        </ul>
        
        {/* .contactBox replaced */}
        <div className="bg-[#f8f9fa] border border-[#e9ecef] rounded-lg px-8 py-6 mt-12">
          {/* h2 styled within box */}
          <h2 className="text-[24px] font-bold text-[#1a1a1a] mt-0 mb-4 border-none p-0">Have Questions?</h2>
          <p className="mb-0">
            Your trust is important to us. If you have any questions at all about your privacy, please <Link href="/contact" className="text-[#007bff] font-semibold no-underline hover:underline"> contact our friendly Aussie team</Link>. For quick answers, you can also visit our <Link href="/faq" className="text-[#007bff] font-semibold no-underline hover:underline">FAQs</Link> page or explore the latest product range on our  <Link href="/bikes" className="text-[#007bff] font-semibold no-underline hover:underline">Shop page</Link>.
          </p>
        </div>
    </div>
    </div>
  );
}