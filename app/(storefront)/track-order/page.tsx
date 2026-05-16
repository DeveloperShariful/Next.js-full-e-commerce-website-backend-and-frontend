import type { Metadata } from 'next';
import TrackOrderForm from './TrackOrderForm';

export const metadata: Metadata = {
  title: 'Track Your Order | GoBike Australia',
  description: 'Track the shipping status of your GoBike order.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: '/track-order',
  }
};

export default function TrackOrderPage() {
  return (
    <main>
      <TrackOrderForm />
    </main>
  );
}