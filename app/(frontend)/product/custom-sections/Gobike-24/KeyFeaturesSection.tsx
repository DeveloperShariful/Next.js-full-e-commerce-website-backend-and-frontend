// ফাইল পাথ: app/product/custom-sections/Gobike-24/KeyFeaturesSection.tsx
import FeatureSlider from '../FeatureSlider';
import styles from '../GobikeSections.module.css';

// Note: Using existing image placeholders. Update URLs to actual 24" bike images if available.
const keyFeatures = [
  {
    imageSrc: 'https://gobikes.au/wp-content/uploads/2025/11/24-W-R-Motor.webp', // Replace with 24" Motor Image
    imageAlt: 'The massive 1500W brushless hub motor on the GoBike 24 Pro.',
    title: 'Extreme 2500W Power',
    description: 'Experience the thrill with our most powerful 2500W motor. Capable of climbing steep hills and hitting 61km/h, it offers unmatched torque for serious riders.'
  },
  {
    imageSrc: 'https://gobikes.au/wp-content/uploads/2025/11/24-Y-R-back-Suspension-scaled.webp', // Replace with 24" Suspension Image
    imageAlt: 'Adjustable hydraulic front forks on the GoBike 24 electric dirt bike.',
    title: 'Pro-Grade Suspension',
    description: 'Featuring TIM Double Shoulder Hydraulic adjustable forks and a FASTACE rear air shock, this system eats up rough terrain for a buttery smooth ride.'
  },
  {
    imageSrc: 'https://gobikes.au/wp-content/uploads/2025/11/24-W-L-Rear-hidrolic-brack-disk-1.webp', // Replace with 24" Brake Image
    imageAlt: 'Hydraulic disc brakes on the GoBike 24 inch e-bike.',
    title: 'Hydraulic Stopping Power',
    description: 'High-speed runs require high-performance braking. Our front and rear hydraulic disc brakes deliver instant, controlled stopping power in all weather conditions.'
  },
  {
    imageSrc: 'https://gobikes.au/wp-content/uploads/2025/11/24-Y-R-Wheel-Front.webp', // Replace with 24" Tires/Seat Image
    imageAlt: '24 inch Kenda Fat Tires on the GoBike Pro model.',
    title: '24" Kenda Fat Tires',
    description: 'Dominate the dirt with 24x2.60" Kenda fat off-road tires. Designed for maximum traction and stability on mud, sand, and rocky trails.'
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