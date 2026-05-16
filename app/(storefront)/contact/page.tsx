// app/contact/page.tsx

import type { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';

export const metadata: Metadata = {
  title: 'Contact Us | GoBike Australia Support',
  description: 'Have a question about our kids electric bikes? Get in touch with the GoBike Australia team. We are here to help you with your inquiries and provide expert support.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Us | GoBike Australia Support',
    description: 'Have a question about our kids electric bikes? Get in touch with the GoBike Australia team for expert support.',
    url: 'https://gobike.au/contact',
    siteName: 'GoBike Australia',
    images: [
      {
        url: 'https://gobikes.au/wp-content/uploads/2025/11/best-electric-bike-for-kids-australia-gobike.jpg', 
        width: 1200,
        height: 857,
        alt: 'Contact GoBike Australia for support',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
};
export default function ContactPage() {
  return (
    <ContactPageClient />
  );
}