// ফাইল পাথ: app/product/custom-sections/Gobike-20/KeyFeaturesSection.tsx
import FeatureSlider from '../FeatureSlider';
import styles from '../GobikeSections.module.css';

const keyFeatures = [
  {
    imageSrc: 'https://gobikes.au/wp-content/uploads/2025/10/20-W-R-Frame-Welds.webp',
    imageAlt: 'The robust front suspension fork on the GoBike 20 fat tyre e-bike.',
    title: 'Trail-Ready Front Suspension',
    description: 'Designed to soak up bumps and rough terrain, this front suspension fork provides a smoother, more controlled ride, boosting confidence on any trail.'
  },
  {
    imageSrc: 'https://gobikes.au/wp-content/uploads/2025/10/20-Y-R-Wheel-Front.webp',
    imageAlt: 'Close-up of the GoBike 20\'s front wheel showing the all-weather disc brake.',
    title: 'All-Weather Hydraulic Disc Brakes',
    description: 'Dependable stopping power is a must. These Hydraulic disc brakes deliver consistent performance in both wet and dry conditions, keeping your rider safe.'
  },
  {
    imageSrc: 'https://gobikes.au/wp-content/uploads/2025/10/20-W-R-Seat.webp',
    imageAlt: 'The adjustable padded comfort seat on the GoBike 20 kids e-bike.',
    title: 'Adjustable Comfort Saddle',
    description: 'The padded saddle ensures a comfy ride, while the quick-release clamp allows for easy height adjustments, ensuring a perfect fit as your child grows.'
  },
  {
    imageSrc: 'https://gobikes.au/wp-content/uploads/2025/10/20-W-R-Motor.webp',
    imageAlt: 'The high-torque rear hub motor on the GoBike 20 electric bike.',
    title: 'High-Torque Hub Motor',
    description: 'This powerful rear motor provides the torque needed to conquer hills and accelerate quickly, delivering an exhilarating ride every time.'
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