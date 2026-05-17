// ফাইল পাথ: app/product/custom-sections/Gobike-12/KeyFeaturesSection.tsx

import FeatureSlider from '../FeatureSlider';

const keyFeatures = [
  {
    imageSrc: 'https://gobikes.au/wp-content/uploads/2025/10/12-Rear-Handle-Bars.webp',
    imageAlt: 'GoBike 12-inch bike with easy-grip toddler handlebars',
    title: 'Easy-Grip Toddler Handlebars',
    description: 'Specially designed for small hands, our handlebars ensure a comfortable and secure grip, making steering intuitive and fun.'
  },
  {
    imageSrc: 'https://gobikes.au/wp-content/uploads/2025/10/12-W-L-Rear.webp',
    imageAlt: 'GoBike 12 with a reliable rear disc brake system for kids',
    title: 'Responsive Rear Disc Brake',
    description: 'Equipped with a powerful yet easy-to-pull rear disc brake, providing safe and reliable stopping power for confident riding.'
  },
  {
    imageSrc: 'https://gobikes.au/wp-content/uploads/2025/10/12-W-R-Wheel-Front.webp',
    imageAlt: 'All-terrain puncture-proof tires on the GoBike 12',
    title: 'All-Terrain Puncture-Proof Tires',
    description: 'No more flat tires! These durable, knobby tires provide excellent traction on any surface, from grassy parks to pavement.'
  },
  {
    imageSrc: 'https://gobikes.au/wp-content/uploads/2025/10/12-W-L-Seat.webp',
    imageAlt: 'Adjustable padded seat for growing children on the GoBike 12',
    title: 'Adjustable Comfort Seat',
    description: 'The padded saddle provides a comfortable ride, and its height can be easily adjusted to ensure a perfect fit as your child grows.'
  }
];

export default function KeyFeaturesSection() {
  return (
    // .sectionContainer replaced
    <section className="w-full py-12 px-[5%] md:px-[1%] box-border"> 
      <FeatureSlider title="More Key Features" features={keyFeatures} />
    </section>
  );
}